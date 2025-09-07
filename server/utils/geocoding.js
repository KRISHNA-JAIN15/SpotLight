const axios = require("axios");

// Mapbox API configuration
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1Ijoia3Jpc2huYTE1MiIsImEiOiJjbWY1bmwwencwNm1jMmxwZmNsM3UwMDRrIn0.NjkCTjZpviTH5Gxlx3Yb-g";

/**
 * Get latitude and longitude from address using Mapbox Geocoding API
 * @param {string} address - Full address or partial address
 * @param {string} city - City name
 * @param {string} state - State name
 * @param {string} pincode - Pincode/Postal code
 * @param {string} country - Country name (default: India)
 * @returns {Object} - {latitude, longitude} or null if not found
 */
const getCoordinatesFromAddress = async (
  address,
  city,
  state,
  pincode,
  country = "India"
) => {
  try {
    // Clean and normalize the address components
    const cleanAddress = (addr) => {
      if (!addr) return "";
      return addr
        .replace(/[,]+/g, ",") // Remove multiple commas
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();
    };

    const cleanAddr = cleanAddress(address);
    const cleanCity = cleanAddress(city);
    const cleanState = cleanAddress(state);
    const cleanPincode = cleanAddress(pincode);

    // Build search queries with different levels of specificity
    const searchQueries = [];

    // Most specific query with full address including pincode
    if (cleanAddr && cleanCity && cleanState && cleanPincode) {
      searchQueries.push(
        [cleanAddr, cleanCity, cleanPincode, cleanState, country]
          .filter(Boolean)
          .join(", ")
      );
    }

    // Query with address, city, state (without pincode)
    if (cleanAddr && cleanCity && cleanState) {
      searchQueries.push(
        [cleanAddr, cleanCity, cleanState, country].filter(Boolean).join(", ")
      );
    }

    // Query with city, pincode, and state
    if (cleanCity && cleanPincode && cleanState) {
      searchQueries.push(
        [cleanCity, cleanPincode, cleanState, country]
          .filter(Boolean)
          .join(", ")
      );
    }

    // Query with just pincode and state (very specific)
    if (cleanPincode && cleanState) {
      searchQueries.push(
        [cleanPincode, cleanState, country].filter(Boolean).join(", ")
      );
    }

    // Query with just city and state (good for general location)
    if (cleanCity && cleanState) {
      searchQueries.push(
        [cleanCity, cleanState, country].filter(Boolean).join(", ")
      );
    }

    // Fallback queries
    if (cleanCity) {
      searchQueries.push([cleanCity, country].filter(Boolean).join(", "));
    }

    if (searchQueries.length === 0) {
      throw new Error("No address information provided");
    }

    // Try each query until we find results
    for (let i = 0; i < searchQueries.length; i++) {
      const searchQuery = searchQueries[i];
      console.log(
        `[${i + 1}/${
          searchQueries.length
        }] Trying Mapbox geocoding: ${searchQuery}`
      );

      try {
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            searchQuery
          )}.json`,
          {
            params: {
              access_token: MAPBOX_ACCESS_TOKEN,
              country: "in", // Limit to India for better accuracy
              limit: 5, // Get more options to find best match
              types: "place,locality,neighborhood,address", // Focus on relevant location types
            },
            timeout: 10000, // 10 second timeout
          }
        );

        if (response.data.features && response.data.features.length > 0) {
          // If we searched with a pincode, try to find a result that matches the pincode
          let bestResult = response.data.features[0]; // Default to first result

          if (cleanPincode) {
            // Look for a result that contains our searched pincode
            const pincodeMatch = response.data.features.find(
              (feature) =>
                feature.place_name && feature.place_name.includes(cleanPincode)
            );

            if (pincodeMatch) {
              bestResult = pincodeMatch;
              console.log(`✓ Found result matching pincode ${cleanPincode}`);
            } else {
              console.log(
                `⚠ No result matches searched pincode ${cleanPincode}, using closest match`
              );
            }
          }

          const [longitude, latitude] = bestResult.center;

          console.log(
            `✓ Mapbox found coordinates for: ${searchQuery} -> ${latitude}, ${longitude}`
          );
          console.log(`  Place: ${bestResult.place_name}`);
          console.log(`  Relevance: ${bestResult.relevance}`);

          // Check if returned place contains the searched pincode
          if (
            cleanPincode &&
            bestResult.place_name &&
            !bestResult.place_name.includes(cleanPincode)
          ) {
            console.log(
              `⚠ Warning: Searched for pincode ${cleanPincode} but result shows different pincode in: ${bestResult.place_name}`
            );
          }

          return {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            displayName: bestResult.place_name,
            confidence: bestResult.relevance || 0,
            queryUsed: searchQuery,
            matchLevel: i + 1, // 1 = exact match, higher = less specific
            source: "mapbox",
            placeType: bestResult.place_type?.[0] || "unknown",
            bbox: bestResult.bbox, // Bounding box for the location
            pincodeMatch: cleanPincode
              ? bestResult.place_name?.includes(cleanPincode)
              : null,
          };
        } else {
          console.log(`✗ No Mapbox results for: ${searchQuery}`);
        }

        // Small delay between requests to be respectful
        if (i < searchQueries.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (requestError) {
        console.error(
          `Mapbox request failed for query "${searchQuery}":`,
          requestError.message
        );
        continue; // Try next query
      }
    }

    console.log(
      `No coordinates found for any of the queries: ${searchQueries.join(
        " | "
      )}`
    );
    return null;
  } catch (error) {
    console.error("Mapbox geocoding error:", error.message);
    return null;
  }
};

/**
 * Fallback geocoding using OpenStreetMap Nominatim API (free backup)
 * @param {string} address - Full address or partial address
 * @param {string} city - City name
 * @param {string} state - State name
 * @param {string} pincode - Pincode/Postal code
 * @param {string} country - Country name (default: India)
 * @returns {Object} - {latitude, longitude} or null if not found
 */
const getCoordinatesFromAddressOSM = async (
  address,
  city,
  state,
  pincode,
  country = "India"
) => {
  try {
    // Clean and normalize the address for better matching
    const cleanAddress = (addr) => {
      if (!addr) return "";
      return addr
        .replace(/[,]+/g, ",") // Remove multiple commas
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();
    };

    // Build multiple search queries with different levels of specificity
    const searchQueries = [];

    // Clean inputs
    const cleanAddr = cleanAddress(address);
    const cleanCity = cleanAddress(city);
    const cleanState = cleanAddress(state);
    const cleanPincode = cleanAddress(pincode);

    // Primary query with full address including pincode
    if (cleanAddr && cleanCity && cleanState && cleanPincode) {
      searchQueries.push(
        `${cleanAddr}, ${cleanCity}, ${cleanPincode}, ${cleanState}, ${country}`
      );
    }

    // Primary query with full address without pincode
    if (cleanAddr && cleanCity && cleanState) {
      searchQueries.push(
        `${cleanAddr}, ${cleanCity}, ${cleanState}, ${country}`
      );
    }

    // Query with city, pincode, and state
    if (cleanCity && cleanPincode && cleanState) {
      searchQueries.push(
        `${cleanCity}, ${cleanPincode}, ${cleanState}, ${country}`
      );
    }

    // Query without building/apartment details (extract major landmarks)
    if (cleanAddr && cleanCity && cleanState) {
      // Try to extract major area/locality from complex address
      const addressParts = cleanAddr.split(",");
      const majorArea =
        addressParts.length > 1
          ? addressParts[addressParts.length - 1].trim()
          : cleanAddr;
      if (majorArea !== cleanAddr) {
        searchQueries.push(
          `${majorArea}, ${cleanCity}, ${cleanState}, ${country}`
        );
      }
    }

    // Fallback queries with reduced specificity
    if (cleanCity && cleanState) {
      searchQueries.push(`${cleanCity}, ${cleanState}, ${country}`);
    }
    if (cleanCity) {
      searchQueries.push(`${cleanCity}, ${country}`);
    }
    if (cleanState) {
      searchQueries.push(`${cleanState}, ${country}`);
    }

    if (searchQueries.length === 0) {
      throw new Error("No address information provided");
    }

    // Try each query until we find results
    for (let i = 0; i < searchQueries.length; i++) {
      const searchQuery = searchQueries[i];
      console.log(
        `[${i + 1}/${
          searchQueries.length
        }] Trying OSM geocoding query: ${searchQuery}`
      );

      try {
        // Make request to Nominatim API
        const response = await axios.get(
          "https://nominatim.openstreetmap.org/search",
          {
            params: {
              q: searchQuery,
              format: "json",
              limit: 1,
              addressdetails: 1,
              countrycodes: "in", // Limit to India for better accuracy
            },
            headers: {
              "User-Agent": "SpotlightApp/1.0 (contact@spotlight.com)", // Required by Nominatim
            },
            timeout: 10000, // 10 second timeout
          }
        );

        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          console.log(
            `✓ OSM found coordinates for: ${searchQuery} -> ${result.lat}, ${result.lon}`
          );

          // Check if returned place contains the searched pincode
          let pincodeMatch = null;
          if (cleanPincode && result.display_name) {
            pincodeMatch = result.display_name.includes(cleanPincode);
            if (!pincodeMatch) {
              console.log(
                `⚠ Warning: Searched for pincode ${cleanPincode} but OSM result shows different pincode in: ${result.display_name}`
              );
            }
          }

          return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            displayName: result.display_name,
            confidence: result.importance || 0,
            queryUsed: searchQuery,
            matchLevel: i + 1, // 1 = exact match, higher = less specific
            source: "osm",
            pincodeMatch: pincodeMatch,
          };
        } else {
          console.log(`✗ No OSM results for: ${searchQuery}`);
        }

        // Add delay between requests to respect API rate limits
        if (i < searchQueries.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (requestError) {
        console.error(
          `OSM request failed for query "${searchQuery}":`,
          requestError.message
        );
        continue; // Try next query
      }
    }

    console.log(
      `No OSM coordinates found for any of the queries: ${searchQueries.join(
        " | "
      )}`
    );
    return null;
  } catch (error) {
    console.error("OSM geocoding error:", error.message);
    return null;
  }
};

/**
 * Main geocoding function using Mapbox API (primary) with OSM fallback
 * @param {string} address
 * @param {string} city
 * @param {string} state
 * @param {string} pincode
 * @param {string} country
 * @returns {Object|null}
 */
const geocodeWithFallback = async (
  address,
  city,
  state,
  pincode,
  country = "India"
) => {
  console.log(
    `Starting geocoding for: ${address}, ${city}, ${state}, ${pincode}, ${country}`
  );

  // Try Mapbox first (more accurate for India)
  let result = await getCoordinatesFromAddress(
    address,
    city,
    state,
    pincode,
    country
  );

  // If we got a result but it doesn't match the pincode, and we have a pincode,
  // let's be more selective about accepting it
  if (result && pincode && result.pincodeMatch === false) {
    console.log(
      `⚠ Mapbox result doesn't match pincode ${pincode}, trying OSM fallback first`
    );

    // Try OSM fallback to see if it gives a better pincode match
    const osmResult = await getCoordinatesFromAddressOSM(
      address,
      city,
      state,
      pincode,
      country
    );

    if (osmResult && osmResult.pincodeMatch !== false) {
      console.log(`✓ OSM provided better pincode match`);
      return osmResult;
    } else {
      console.log(`✓ Using Mapbox result despite pincode mismatch`);
      return result;
    }
  }

  if (result) {
    return result;
  }

  // Try OpenStreetMap as fallback (free backup)
  result = await getCoordinatesFromAddressOSM(
    address,
    city,
    state,
    pincode,
    country
  );
  if (result) {
    return result;
  }

  console.log("All geocoding services failed");
  return null;
};

/**
 * Alternative geocoding using Google Maps API (requires API key)
 * Uncomment and use this if you have a Google Maps API key
 */
/*
const getCoordinatesFromAddressGoogle = async (address, city, state, country = 'India') => {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    let searchQuery = '';
    if (address) searchQuery += `${address}, `;
    if (city) searchQuery += `${city}, `;
    if (state) searchQuery += `${state}, `;
    searchQuery += country;

    searchQuery = searchQuery.replace(/,\s*$/, '').trim();

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: searchQuery,
        key: GOOGLE_API_KEY
      },
      timeout: 10000
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        displayName: result.formatted_address,
        confidence: 1
      };
    } else {
      console.log(`Google geocoding failed for: ${searchQuery}`, response.data.status);
      return null;
    }
  } catch (error) {
    console.error('Google geocoding error:', error.message);
    return null;
  }
};
*/

/**
 * Validate coordinates
 * @param {number} latitude
 * @param {number} longitude
 * @returns {boolean}
 */
const validateCoordinates = (latitude, longitude) => {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
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
  return distance;
};

module.exports = {
  getCoordinatesFromAddress,
  getCoordinatesFromAddressOSM,
  geocodeWithFallback,
  validateCoordinates,
  calculateDistance,
};
