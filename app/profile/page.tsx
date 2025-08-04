import React from "react";
import Navbar from "../components/Navbar";

const UserProfile = () => {
  return (
    <div className="flex flex-row">
      <Navbar />
      <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 ml-64 sm:p-20 w-full">
        <h1 className="text-white text-4xl">Welcome to USERPAGE</h1>
      </div>
    </div>
  );
};

export default UserProfile;
