"use client";
import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Navbar from "../components/Navbar";
import { useAuth } from "@/app/context/AuthContext";
import { useSearchParams } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  endAt,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  startAt,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  photoURL: string;
}

function UserPageContent() {
  const searchParams = useSearchParams();
  const userName = searchParams.get("userName") || "";
  const [users, setUsers] = useState<User[]>([]);
  const { firestoreUser, isAuthenticated } = useAuth();
  const [following, setFollowing] = useState([""]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          orderBy("username"),
          startAt(userName),
          endAt(userName + "\uf8ff")
        );
        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<User, "id">),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchAllUsers();
  }, [userName]);

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
    <div className="flex flex-row">
      <Navbar />
      <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 w-full">
        <ul className="list w-full md:w-130 lg:w-190 xl:w-200 rounded-2xl shadow-md bg-base-200">
          <li className="p-4 pb-2 text-xs tracking-wide">List of all users</li>
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between p-4">
              <a
                href={`/profile/${user.id}`}
                className="flex items-center gap-4"
              >
                <Image
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
                  onClick={() => {
                    if (firestoreUser?.uid) {
                      following.includes(user.id)
                        ? unfollowUser(firestoreUser.uid, user.id)
                        : followUser(firestoreUser.uid, user.id);
                    }
                  }}
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
  );
}

const UserPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserPageContent />
    </Suspense>
  );
};

export default UserPage;
