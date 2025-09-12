"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "../context/AuthContext";

export function useFollowers() {
  const { firestoreUser } = useAuth();
  const [followers, setFollowers] = useState<string[]>([]);

  useEffect(() => {
    if (!firestoreUser) return;
    
    const userFollwersCollectionRef = collection(
      db,
      "users",
      firestoreUser.uid,
      "followers"
    );

    // realtime listener
    const unsubscribe = onSnapshot(userFollwersCollectionRef, (snapshot) => {
      const userList = snapshot.docs.map((doc) => doc.id);
      setFollowers(userList);
    });

    // return the unsubscribe for cleanup
    return unsubscribe;
  }, [firestoreUser]);

  return followers;
}
