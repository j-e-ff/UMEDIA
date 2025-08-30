"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "../context/AuthContext";

interface Forum {
  forumId: string;
  forumName: string;
  followedAt: Date;
}

export function useFollowingForums() {
  const { firestoreUser } = useAuth();
  const [followingForums, setFollowingForums] = useState<Forum[]>([]);

  useEffect(() => {
    const fetchFollowingForums = async () => {
      if (!firestoreUser?.uid) return;

      const followingForumsCollectionRef = collection(
        db,
        "users",
        firestoreUser.uid,
        "followingForum"
      );

      const querySnapshot = await getDocs(followingForumsCollectionRef);
      //   explicitly map the documents to Forum interface
      const forumsList: Forum[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          forumId: doc.id,
          forumName: data.name,
          followedAt: data.followedAt,
        };
      });
      setFollowingForums(forumsList);
    };
    fetchFollowingForums();
  }, [firestoreUser?.uid]);

  return followingForums;
}

