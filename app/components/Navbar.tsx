"use client";
import React from "react";
import GoogleSignIn from "./GoogleSignIn";

const Navbar = () => {
  return (
    <div className="w-64 fixed h-full ">
      {/* Permanent Sidebar */}
      <nav className="fixed top-0 left-0 h-screen w-55 bg-base-200 text-base-content p-4 shadow flex flex-col justify-between">
        <ul className="menu space-y-3 text-xl">
          <li>
            <a href="/">UMEDIA</a>
          </li>
          <li>
            <a href="/search">Search</a>
          </li>
          <li>
            <a href="/messages">Messages</a>
          </li>
          <li>
            <a href="/posting">Post</a>
          </li>
        </ul>
        <GoogleSignIn />
      </nav>
    </div>
  );
};

export default Navbar;
