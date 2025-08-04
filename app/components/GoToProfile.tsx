"use client";
import React from "react";
import Link from 'next/link'

const GoToProfile = () => {
  return (
    <div>
      <Link href="/profile">
          <button className="btn btn-primary">
            go to profile
          </button>
      </Link>
    </div>
  );
};

export default GoToProfile;
