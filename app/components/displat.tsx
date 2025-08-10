"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { auth, googleProvider, db } from "@/lib/firebase";
import { useAuth } from "../context/AuthContext";
import { signInWithPopup } from "firebase/auth";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  photoURL: string;
  bio?: string;
}

const UserProfile = () => {
  const { user, firestoreUser, loading, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [coverImage, setCoverImage] = useState("");
  

  if (!isAuthenticated) {
    return (
      <div className="flex flex-row min-h-screen">
        <Navbar />
        <div className=" font-sans flex flex-col items-center justify-items-center min-screen p-8 pb-20 ml-64 sm:p-20 w-full">
          <div className="w-full max-w-4xl">
            <h1 className="text-2xl font-bold mb-4">Sign in to create posts</h1>
            <p className=" mb-4">you need to be signed in to create a post</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row ml-64">
      <Navbar />
      <div className="font-sans flex flex-col p-8 pb-20 gap-8 sm:p-20 w-full overflow-hidden">
        <h1>Profile Page</h1>
        <div className="">
          <div className="hero bg-base-200 ">
            <div className="hero-content flex-col">
              <img
                src="https://pub-3d7f192d5f3e48728c4bd513008aa127.r2.dev/1754265006060-oim.jpg"
                className="object-stre rounded-lg shadow-2xl"
              />
              <div className="flex flex-col gap-4">
                <textarea
                  className="resize textarea textarea-secondary"
                  placeholder="Bio"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
