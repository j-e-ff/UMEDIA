"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "../components/Navbar";
import { useUsers } from "../hooks/useUsers";
import { useForums } from "../hooks/useForums";
import { followUser } from "../utils/followUser";
import { unfollowUser } from "../utils/unfollowUser";
import { followForum } from "../utils/followForum";
import { unfollowForum } from "../utils/unfollowForum";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SearchPage = () => {
  const { firestoreUser, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [following, setFollowing] = useState([""]);
  const [followingForums, setFollowingForums] = useState([""]);
  const [searchType, setSearchType] = useState("Users");
  const users = useUsers(searchTerm);
  const forums = useForums(searchTerm);

  console.log("forums", forums);

  useEffect(() => {
    if (!firestoreUser?.uid) return;

    const followingCollectionRef = collection(
      db,
      "users",
      firestoreUser.uid,
      "followingUser"
    );

    const unsubscribe = onSnapshot(followingCollectionRef, (querySnapshot) => {
      const followingIds = querySnapshot.docs.map((doc) => doc.id);
      setFollowing(followingIds);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, [firestoreUser?.uid]);

  useEffect(() => {
    if (!firestoreUser?.uid) return;
    const followingForumsColelctionRef = collection(
      db,
      "users",
      firestoreUser.uid,
      "followingForum"
    );
    const unsubscribe = onSnapshot(
      followingForumsColelctionRef,
      (querySnapshot) => {
        const followingIds = querySnapshot.docs.map((doc) => doc.id);
        setFollowingForums(followingIds);
      }
    );
    return () => unsubscribe();
  }, [firestoreUser?.uid]);

  return (
    <div className="flex flex-row ml-20 min-h-screen ">
      <Navbar />
      <div className="font-sans flex flex-col items-center justify-items-center min-h-screen ml-2 pt-20 w-full xl:ml-43">
        <h1 className="pb-15 xl:text-lg">SEARCH PAGE</h1>
        <label className="input xl:input-lg xl:w-120">
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
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
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
        <div className="flex flex-row">
          <div className=" font-sans flex flex-col items-center justify-items-center min-h-screen ml-2 pt-10 w-full">
            <div className="join join-horizontal pb-10 ml-2">
              <button
                className={`btn join-item xl:btn-lg ${
                  searchType === "Users"
                    ? "bg-primary text-primary-content"
                    : "bg-none"
                }`}
                aria-label="Users"
                value="users"
                onClick={() => setSearchType("Users")}
              >
                Users
              </button>
              <button
                className={`btn join-item xl:btn-lg ${
                  searchType === "Forums"
                    ? "bg-primary text-primary-content"
                    : "bg-none"
                }`}
                aria-label="Forums"
                value="forums"
                onClick={() => setSearchType("Forums")}
              >
                Forums
              </button>
            </div>
            {searchType === "Users" && (
                <ul className="list w-full md:w-130 lg:w-190 xl:w-220 rounded-2xl shadow-md bg-base-200">
                  <li className="p-4 pb-2 tracking-wide xl:text-2xl">
                    List of all users
                  </li>
                  {users.map((user) => (
                    <li
                      key={user.id}
                      onClick={() =>
                        (window.location.href = `profile/${user.id}`)
                      } // whole row navigates
                      className="flex items-center justify-between cursor-pointer py-2 px-4 hover:bg-primary hover:text-primary-content"
                    >
                      <div className="flex items-center gap-4">
                        <div className="pr-15 w-16 h-16 xl:w-22 xl:h-22 relative ">
                          <Image
                            className="size-16 xl:size-22 object-cover rounded-box"
                            src={user.photoURL}
                            alt={user.username}
                            fill
                          />
                        </div>
                        <div>
                          <p className="text-base xl:text-2xl wrap-anywhere">{user.username}</p>
                          <p className="uppercase text-lg xl:text-lg wrap-anywhere">{user.email}</p>
                        </div>
                      </div>
                      {isAuthenticated && firestoreUser?.uid !== user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (firestoreUser?.uid) {
                              following.includes(user.id)
                                ? unfollowUser(firestoreUser.uid, user.id)
                                : followUser(firestoreUser.uid, user.id);
                            }
                          }}
                          className="btn btn-circle xl:btn-lg ml-16 bg-transparent border-none"
                        >
                          <svg
                            className="size-[1.2em] hover:size-[1.7em]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <g
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              strokeWidth="2"
                              fill={
                                following.includes(user.id) ? "red" : "none"
                              }
                              stroke="currentColor"
                            >
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                            </g>
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
             
            )}
            {searchType === "Forums" && (
              <ul className="list w-full md:w-130 lg:w-190 xl:w-220 rounded-2xl shadow-md bg-base-200">
                <li className="p-4 pb-2 xl:text-2xl tracking-wide">
                  List of all forums
                </li>
                {forums.map((forum) => (
                  <li
                    key={forum.forumId}
                    onClick={() =>
                      (window.location.href = `forum/${forum.forumId}`)
                    } // whole row navigates
                    className="flex items-center justify-between cursor-pointer py-2 px-4 hover:bg-primary hover:text-primary-content"
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        className="size-16 xl:size-22 object-cover rounded-box"
                        src={forum.forumImage}
                        alt={forum.name}
                        width={48}
                        height={48}
                      />
                      <p className="text-base xl:text-2xl">{forum.name}</p>
                    </div>

                    {isAuthenticated && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (firestoreUser?.uid) {
                            followingForums.includes(forum.forumId)
                              ? unfollowForum(firestoreUser.uid, forum.forumId)
                              : followForum(firestoreUser.uid, forum);
                          }
                        }}
                        className="btn btn-circle xl:btn-lg ml-16 bg-transparent border-none"
                      >
                        <svg
                          className="size-[1.2em] hover:size-[1.9em] "
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <g
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth="2"
                            fill={
                              followingForums.includes(forum.forumId)
                                ? "red"
                                : "none"
                            }
                            stroke="currentColor"
                          >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                          </g>
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
