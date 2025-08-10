"use client";
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import UserPage from "../users/page";

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex flex-row ml-64 ">
      <Navbar />
      <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20  sm:p-20 w-full">
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
          <input
            type="search"
            required
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="grow"
          />
        </label>
        <UserPage userName={searchTerm}/>
      </div>
    </div>
  );
};

export default SearchPage;
