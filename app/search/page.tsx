import React from "react";
import Navbar from "../components/Navbar";

const SearchPage = () => {
  return (
    <div className="flex flex-row ">
      <Navbar />
      <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 ml-64 sm:p-20 w-full">
        <h1>SEARCH PAGE</h1>
        <label className="input">
            <svg
              className="h-[1em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input type="search" required placeholder="Search" />
          </label>
      </div>
    </div>
  );
};

export default SearchPage;
