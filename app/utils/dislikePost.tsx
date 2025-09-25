"use client";
import { db } from "@/lib/firebase";
import {
  writeBatch,
  collection,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export async function dislikePost(userId: string, postId: string) {
  try {
    const batch = writeBatch(db);

    // User's dislikes subcolletion
    const userDislikeRef = doc(
      collection(db, "users", userId, "dislikes"),
      postId
    );
    batch.set(userDislikeRef, { postId, createdAt: serverTimestamp() });

    // Post's dislikes subcollection
    const postDislikeRef = doc(
      collection(db, "posts", postId, "dislikes"),
      userId
    );
    batch.set(postDislikeRef, { userId, createdAt: serverTimestamp() });

    await batch.commit();
  } catch (error) {
    console.error("Error with batch write (dislikePost)", error);
  }
}
