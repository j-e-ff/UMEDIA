"use client";
import { db } from "@/lib/firebase";
import {
  writeBatch,
  collection,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export async function likePost(userId: string, postId: string) {
  try {
    const batch = writeBatch(db);

    // User's likes subcollection
    const userLikeRef = doc(collection(db, "users", userId, "likes"), postId);
    batch.set(userLikeRef, { postId, createdAt: serverTimestamp() });

    // Post's likes subcollection
    const postLikeRef = doc(collection(db, "posts", postId, "likes"), userId);
    batch.set(postLikeRef, { userId, createdAt: serverTimestamp() });

    await batch.commit();
  } catch (error) {
    console.error("Error with batch write (likePost)", error);
  }
}
