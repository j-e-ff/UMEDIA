"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "../context/AuthContext";

export function useFollowingUsers() {
  const { firestoreUser } = useAuth();
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!firestoreUser?.uid) return;
    const fetchFollowingUsers = async () => {
      const followingUsersCollectionRef = collection(
        db,
        "users",
        firestoreUser.uid,
        "followingUser"
      );

      //  realtime listener
      const unsubscribe = onSnapshot(
        followingUsersCollectionRef,
        (snapshot) => {
          const userList = snapshot.docs.map((doc) => doc.id);
          setFollowingUsers(userList);
        }
      );
    };
    fetchFollowingUsers();
  }, [firestoreUser?.uid]);

  return followingUsers;
}
