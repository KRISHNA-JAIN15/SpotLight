const redis = require("../config/redis");
const { TOP_CITIES_INDIA } = require("../config/topCities");
const Event = require("../models/Event");

class CacheService {
  constructor() {
    this.client = redis;
  }

  // Check if a city is in our top cities list
  isTopCity(cityName) {
    return TOP_CITIES_INDIA.find(
      (city) => city.name.toLowerCase() === cityName.toLowerCase()
    );
  }

  // Generate cache key for events by location
  generateLocationCacheKey(city, radius, filters = {}) {
    const filterStr = Object.keys(filters)
      .sort()
      .map((key) => `${key}:${filters[key]}`)
      .join("|");

    return `events:location:${city.toLowerCase()}:${radius}km${
      filterStr ? ":" + filterStr : ""
    }`;
  }

  // Get cached events for a location
  async getCachedEvents(cacheKey) {
    try {
      const cached = await this.client.get(cacheKey);
      if (cached) {
        const parsedData = JSON.parse(cached);
        console.log(
          `Cache hit - returning ${
            parsedData.data?.length || 0
          } events for key: ${cacheKey}`
        );
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  // Set cache for location-based events
  async setCacheEvents(cacheKey, data, duration = 600) {
    try {
      await this.client.setex(cacheKey, duration, JSON.stringify(data));
      console.log(`Cache set: ${cacheKey} for ${duration}s`);
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  // Get events for a specific city with caching
  async getEventsForCity(cityName, radius = 10, filters = {}) {
    const startTime = Date.now();
    console.log(
      `⏱️ [${new Date().toISOString()}] Starting search for ${cityName} - radius: ${radius}km`
    );

    const city = this.isTopCity(cityName);

    if (!city) {
      // Not a top city, fetch directly without caching
      const dbStartTime = Date.now();
      console.log(
        `📍 [${new Date().toISOString()}] ${cityName} is not a top city - fetching directly from DB`
      );

      const result = await this.fetchEventsFromDB(cityName, radius, filters);
      const dbEndTime = Date.now();
      const dbDuration = dbEndTime - dbStartTime;

      console.log(
        `⚡ [${new Date().toISOString()}] DB query completed for ${cityName} in ${dbDuration}ms - found ${
          result.length
        } events`
      );
      return result;
    }

    // Generate cache key
    const cacheKey = this.generateLocationCacheKey(cityName, radius, filters);

    // Try to get from cache first
    const cacheStartTime = Date.now();
    const cachedData = await this.getCachedEvents(cacheKey);
    const cacheEndTime = Date.now();
    const cacheDuration = cacheEndTime - cacheStartTime;

    if (cachedData) {
      const totalDuration = Date.now() - startTime;
      console.log(
        `🚀 [${new Date().toISOString()}] CACHE HIT for ${cityName} in ${cacheDuration}ms - Total: ${totalDuration}ms - returning ${
          cachedData.data?.length || 0
        } events`
      );
      return {
        ...cachedData,
        fromCache: true,
        cacheKey,
      };
    }

    // Cache miss - fetch from database and cache the result
    const dbStartTime = Date.now();
    console.log(
      `💾 [${new Date().toISOString()}] CACHE MISS for ${cityName} - fetching from DB and caching`
    );

    const events = await this.fetchEventsFromDB(cityName, radius, filters);
    const dbEndTime = Date.now();
    const dbDuration = dbEndTime - dbStartTime;
    const totalDuration = Date.now() - startTime;

    console.log(
      `⚡ [${new Date().toISOString()}] DB query completed for ${cityName} in ${dbDuration}ms - Total: ${totalDuration}ms - found ${
        events.length
      } events`
    );

    // Only cache if we have events - don't cache empty results
    if (events && events.length > 0) {
      const cacheSetStartTime = Date.now();

      const responseData = {
        success: true,
        data: events,
        city: cityName,
        radius,
        filters,
        timestamp: new Date().toISOString(),
      };

      await this.setCacheEvents(cacheKey, responseData, city.cacheDuration);
      const cacheSetEndTime = Date.now();
      const cacheSetDuration = cacheSetEndTime - cacheSetStartTime;

      console.log(
        `💾 [${new Date().toISOString()}] Cached ${
          events.length
        } events for ${cityName} in ${cacheSetDuration}ms - Cache duration: ${
          city.cacheDuration
        }s`
      );

      return {
        ...responseData,
        fromCache: false,
        cacheKey,
      };
    } else {
      // Return data without caching for empty results
      console.log(
        `❌ [${new Date().toISOString()}] No events found for ${cityName} - not caching empty result (Total: ${totalDuration}ms)`
      );
      return {
        success: true,
        data: events,
        city: cityName,
        radius,
        filters,
        timestamp: new Date().toISOString(),
        fromCache: false,
        cacheKey,
      };
    }
  }

  // Fetch events from database
  async fetchEventsFromDB(cityName, radius, filters = {}) {
    const dbFetchStartTime = Date.now();

    try {
      const city = TOP_CITIES_INDIA.find(
        (c) => c.name.toLowerCase() === cityName.toLowerCase()
      );

      if (!city) {
        console.error(
          `❌ [${new Date().toISOString()}] City ${cityName} not found in top cities list`
        );
        return [];
      }

      console.log(
        `🔍 [${new Date().toISOString()}] Fetching events for ${cityName} within ${radius}km, filters:`,
        filters
      );

      // Simplified query approach - first get all events then filter by distance
      const events = await Event.find({
        status: { $in: ["upcoming", "ongoing"] },
        isActive: true,
        "dateTime.startDate": { $gte: new Date() },
      })
        .populate("venue", "name address city state location")
        .populate("organizer", "name email")
        .limit(100); // Get more initially, then filter

      console.log(`Found ${events.length} events before distance filtering`);

      // Filter by distance and other criteria
      const filteredEvents = events.filter((event) => {
        if (
          !event.venue ||
          !event.venue.location ||
          !event.venue.location.coordinates
        ) {
          return false;
        }

        // Calculate distance using simple formula
        const lat1 = city.coordinates[1];
        const lon1 = city.coordinates[0];
        const lat2 = event.venue.location.coordinates[1];
        const lon2 = event.venue.location.coordinates[0];

        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Check distance
        if (distance > radius) {
          return false;
        }

        // Add distance to event object
        event.distance = distance;

        // Check category filter
        if (filters.category && event.category !== filters.category) {
          return false;
        }

        // Check search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const titleMatch = event.title.toLowerCase().includes(searchLower);
          const descMatch = event.description
            .toLowerCase()
            .includes(searchLower);
          if (!titleMatch && !descMatch) {
            return false;
          }
        }

        return true;
      });

      // Sort by distance
      filteredEvents.sort((a, b) => a.distance - b.distance);

      // Limit to 50 results
      const finalEvents = filteredEvents.slice(0, 50);

      const dbFetchDuration = Date.now() - dbFetchStartTime;
      console.log(
        `🎯 [${new Date().toISOString()}] DB fetch completed: ${
          finalEvents.length
        } events after filtering for ${cityName} in ${dbFetchDuration}ms`
      );

      return finalEvents;
    } catch (error) {
      const dbFetchDuration = Date.now() - dbFetchStartTime;
      console.error(
        `❌ [${new Date().toISOString()}] Error fetching events for ${cityName} after ${dbFetchDuration}ms:`,
        error
      );
      return [];
    }
  }

  // Initialize cache service
  async initializeCache() {
    try {
      // Test Redis connection
      await this.client.ping();
      console.log("Redis cache service initialized successfully");
      return true;
    } catch (error) {
      console.error("Redis cache initialization failed:", error);
      return false;
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      const keys = await this.client.keys("events:location:*");
      const stats = {
        totalCachedSearches: keys.length,
        cachedCities: [...new Set(keys.map((key) => key.split(":")[2]))],
        cacheKeys: keys,
      };
      return stats;
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return { totalCachedSearches: 0, cachedCities: [], cacheKeys: [] };
    }
  }

  // Invalidate cache for a city
  async invalidateCityCache(cityName) {
    try {
      const pattern = `events:location:${cityName.toLowerCase()}:*`;
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(...keys);
        console.log(`Invalidated ${keys.length} cache keys for ${cityName}`);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }

  // Get top cities list
  getTopCities() {
    return TOP_CITIES_INDIA.map((city) => ({
      name: city.name,
      state: city.state,
      tier: city.tier,
    }));
  }
}

module.exports = new CacheService();
