"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "../components/Navbar";
import { useUsers } from "../hooks/useUsers";
import { useForums } from "../hooks/useForums";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Forum {
  createdAt: string;
  createdBy: string;
  coverImage: string;
  description: string;
  forumId: string;
  forumImage: string;
  name: string;
}

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

  async function followUser(currentUserId: string, targetUserId: string) {
    // add to "followingUser" subcollection in firestore
    await setDoc(
      doc(db, "users", currentUserId, "followingUser", targetUserId),
      { followedAt: serverTimestamp() }
    );

    // add to "followers" subcollection
    await setDoc(doc(db, "users", targetUserId, "followers", currentUserId), {
      followedAt: serverTimestamp(),
    });
  }

  async function unfollowUser(currentUserId: string, targetUserId: string) {
    // Remove targetUserId from currentUserId's followingUser subcollection
    await deleteDoc(
      doc(db, "users", currentUserId, "followingUser", targetUserId)
    );

    // Remove currentUserId from targetUserId's followers subcollection
    await deleteDoc(doc(db, "users", targetUserId, "followers", currentUserId));
  }

  async function followForum(currentUserId: string, forum: Forum) {
    // add to followingForum subcollection in firestore
    // adding only the followedAt, name, and forumId (used to display when creating a post)
    await setDoc(
      doc(db, "users", currentUserId, "followingForum", forum.forumId),
      {
        followedAt: serverTimestamp(),
        name: forum.name,
        forumId: forum.forumId,
      }
    );
  }

  async function unfollowForum(currentUserId: string, forumId: string) {
    await deleteDoc(doc(db, "users", currentUserId, "followingForum", forumId));
  }

  return (
    <div className="flex flex-row ml-64 min-h-screen">
      <Navbar />
      <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-12  sm:p-20 w-full">
        <h1 className="mb-8">SEARCH PAGE</h1>
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
          <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 w-full">
            <div className="join join-horizontal">
              <button
                className={`btn join-item ${
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
                className={`btn join-item ${
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
              <ul className="list w-full md:w-130 lg:w-190 xl:w-200 rounded-2xl shadow-md bg-base-200">
                <li className="p-4 pb-2 text-xs tracking-wide">
                  List of all users
                </li>
                {users.map((user) => (
                  <a
                    href={`/profile/${user.id}`}
                    key={user.id}
                    className="flex items-center justify-between hover:bg-primary hover:text-primary-content "
                  >
                    <li
                      key={user.id}
                      className="flex items-center justify-between  w-full"
                    >
                      <div className="flex items-center gap-4 pl-4">
                        <img
                          className="size-16 object-contain rounded-box "
                          src={user.photoURL}
                          alt={user.username}
                        />
                        <div>
                          <p className="text-base">{user.username}</p>
                          <p className="uppercase text-xs">{user.email}</p>
                        </div>
                      </div>

                      {isAuthenticated && firestoreUser?.uid !== user.id && (
                        <button
                          onClick={() =>
                            following.includes(user.id)
                              ? unfollowUser(firestoreUser?.uid!, user.id)
                              : followUser(firestoreUser?.uid!, user.id)
                          }
                          className="btn btn-circle ml-16 bg-transparent"
                        >
                          <svg
                            className="size-[1.2em] hover:size-[1.7em] "
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
                  </a>
                ))}
              </ul>
            )}
            {searchType === "Forums" && (
              <ul className="list w-full md:w-130 lg:w-190 xl:w-200 rounded-2xl shadow-md bg-base-200">
                <li className="p-4 pb-2 text-xs tracking-wide">
                  List of all forums
                </li>
                {forums.map((forum) => (
                  <li
                    key={forum.forumId}
                    className="flex items-center justify-between p-4 hover:bg-primary hover:text-primary-content"
                  >
                    <a
                      href={`/forum/${forum.forumId}`}
                      className="flex items-center gap-4"
                    >
                      <img
                        className="size-16 object-contain rounded-box"
                        src={forum.forumImage}
                        alt={forum.name}
                      />
                      <div className="">
                        <p className="text-base">{forum.name}</p>
                        {/* <p className="text-xs">{forum.email}</p> */}
                      </div>
                    </a>

                    {isAuthenticated && (
                      <button
                        onClick={() =>
                          followingForums.includes(forum.forumId)
                            ? unfollowForum(firestoreUser?.uid!, forum.forumId)
                            : followForum(firestoreUser?.uid!, forum)
                        }
                        className="btn btn-circle ml-16 bg-transparent"
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
