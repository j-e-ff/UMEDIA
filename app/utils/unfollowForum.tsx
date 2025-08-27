"use client";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function unfollowForum(currentUserId: string, forumId: string) {
  await deleteDoc(doc(db, "users", currentUserId, "followingForum", forumId));
}
