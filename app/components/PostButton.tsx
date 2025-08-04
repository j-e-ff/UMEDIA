"use client";
import React from "react";
import Link from "next/link";

const PostButton = () => {
  return (
    <div>
      <Link href="/posting" className="btn btn-primary">
        Make a post
      </Link>
    </div>
  );
};

export default PostButton;
