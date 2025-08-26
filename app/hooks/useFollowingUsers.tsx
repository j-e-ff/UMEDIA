"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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
      
      const querySnapshot = await getDocs(followingUsersCollectionRef);
      // the subcollection only contains the user ids as document ids and followedAt as field, se we just map the doc ids
      const usersList: string[] = querySnapshot.docs.map((doc) =>  doc.id); 
      setFollowingUsers(usersList);
    };
    fetchFollowingUsers();
  }, [firestoreUser?.uid]);

  return followingUsers;
}
