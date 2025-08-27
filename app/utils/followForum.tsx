"use client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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

export async function followForum(currentUserId: string, forum: Forum) {
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