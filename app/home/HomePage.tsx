"use client";
import DisplayPost from "../components/DisplayPost";
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "@/app/context/AuthContext";
import { signInWithPopup } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { db, googleProvider, auth } from "@/lib/firebase";

const HomePage = () => {
  const { firestoreUser, isAuthenticated} = useAuth();
  const [followingForum, setFollowingForum] = useState([""]);

  // useEffect for fetching followingForums
  useEffect(() => {
    const fetchFollowingForums = async () => {
      if (!firestoreUser) return;
      try {
        const followingForumsColelctionRef = collection(
          db,
          "users",
          firestoreUser.uid,
          "followingForum"
        );

        const querySnapshot = await getDocs(followingForumsColelctionRef);

        //explicitly map the fields into the FollowingForum interface
        const followingForums = querySnapshot.docs.map(
          (doc) => doc.id
        );
        setFollowingForum(followingForums);
      } catch (error) {
        console.error("Failed to fetch following forums", error);
      }
    };
    fetchFollowingForums();
  }, [firestoreUser]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-row">
        <Navbar />
        <div className="font-sans flex flex-row h-screen w-full overflow-hidden">
          <div className="w-full max-w-4xl px-4 m-auto text-center">
            <h1 className="text-2xl font-bold mb-4 xl:text-4xl">Sign in to view posts</h1>
            <p className="text-gray-600 mb-4 xl:text-2xl">
              posts are shown based on followings, go to search section to view forums
            </p>
            <button
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="btn bg-white  text-black border-[#e5e5e5] xl:btn-lg "
            >
              <svg
                aria-label="Google logo"
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
              >
                <g>
                  <path d="m0 0H512V512H0" fill="#fff"></path>
                  <path
                    fill="#34a853"
                    d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"
                  ></path>
                  <path
                    fill="#4285f4"
                    d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"
                  ></path>
                  <path
                    fill="#fbbc02"
                    d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"
                  ></path>
                  <path
                    fill="#ea4335"
                    d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"
                  ></path>
                </g>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }
  return <DisplayPost forumId={followingForum} location="home" />;
};

export default HomePage;
