"use client";
import React from "react";
import Link from "next/link";
import GoogleSignIn from "./GoogleSignIn";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Permanent Sidebar */}
      <nav className="fixed bottom-0 left-1/3 transform -translate-x-1/6 z-10 sm:translate-none rounded-full h-20 sm:h-screen sm:rounded-none sm:w-20 lg:w-20 xl:w-50 2xl:w-60 bg-base-300 w-text-base-content flex flex-row sm:flex-col sm:fixed sm:top-0 sm:left-0 sm:justify-between">
        <ul className="menu menu-horizontal sm:menu-vertical sm:space-y-3 text-xl sm:pt-4">
          <li>
            <Link href="/" className="md:text-2xl sm:text-sm w-full p-1 2xl:text-3xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="bi bi-house w-14 2xl:w-16"
                viewBox="-4 -4 24 24"
              >
                <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z" />
              </svg>
              <span className="hidden xl:inline">Home</span>
            </Link>
          </li>
          <li>
            <Link href="/search" className="md:text-2xl sm:text-sm w-full p-1 2xl:text-3xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="bi bi-search w-14 2xl:w-16"
                viewBox="-4 -4 24 24"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
              </svg>
              <span className="hidden xl:inline">Search</span>
            </Link>
          </li>
          <li>
            <Link
              href="/messages"
              className="md:text-2xl sm:text-sm w-full p-1 2xl:text-3xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="bi bi-send w-14 2xl:w-16"
                viewBox="-4 -4 24 24"
              >
                <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
              </svg>
              <span className="hidden xl:inline">Messages</span>
            </Link>
          </li>
          {isAuthenticated && (
            <li>
              <Link
                href="/posting"
                className="md:text-2xl sm:text-sm w-full p-1 2xl:text-3xl"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  className="bi bi-plus-lg w-14 2xl:w-16"
                  viewBox="-4 -4 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"
                  />
                </svg>
                <span className="hidden xl:inline">Post</span>
              </Link>
            </li>
          )}
        </ul>
        <GoogleSignIn />
      </nav>
    </div>
  );
};

export default Navbar;
