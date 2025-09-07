import React from "react";
import Navbar from "../components/Navbar";
import EventList from "../components/events/EventList";

const MyEventsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
        <EventList />
      </div>
    </div>
  );
};

export default MyEventsPage;
