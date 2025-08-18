"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "../components/Navbar";
import { useUsers } from "../hooks/useUsers";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const SearchPage = () => {
  const { firestoreUser, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [following, setFollowing] = useState([""]);
  const users = useUsers(searchTerm);

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
          <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 w-full">
            <ul className="list w-full md:w-130 lg:w-190 xl:w-200 rounded-2xl shadow-md bg-base-200">
              <li className="p-4 pb-2 text-xs tracking-wide">
                List of all users
              </li>
              {users.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between p-4"
                >
                  <a
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-4"
                  >
                    <img
                      className="size-16 object-contain rounded-box"
                      src={user.photoURL}
                      alt={user.username}
                    />
                    <div className="uppercase">
                      <p className="text-base">{user.username}</p>
                      <p className="text-xs">{user.email}</p>
                    </div>
                  </a>

                  {firestoreUser?.uid !== user.id && isAuthenticated && (
                    <button
                      onClick={() =>
                        following.includes(user.id)
                          ? unfollowUser(firestoreUser?.uid!, user.id)
                          : followUser(firestoreUser?.uid!, user.id)
                      }
                      className="btn btn-square btn-ghost ml-16"
                    >
                      <svg
                        className="size-[1.2em]"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <g
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          strokeWidth="2"
                          fill={following.includes(user.id) ? "red" : "none"}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
