import React from "react";
import VenueList from "../components/venues/VenueList";
import Navbar from "../components/Navbar";

const MyVenuesPage = () => {
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 py-8">
        <VenueList />
      </div>
    </>
  );
};

export default MyVenuesPage;
