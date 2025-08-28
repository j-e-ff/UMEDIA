"use client";
import { db } from "@/lib/firebase";
import { writeBatch, collection, doc } from "firebase/firestore";

export async function unlikePost(userId: string, postId: string) {
  try {
    const batch = writeBatch(db);

    // User's likes subcollection
    const userLikeRef = doc(collection(db, "users", userId, "likes"), postId);
    batch.delete(userLikeRef);

    // Posts's likes subcollection
    const postLikeRef = doc(collection(db, "posts", postId, "likes"), userId);
    batch.delete(postLikeRef);

    await batch.commit();
  } catch (error) {
    console.error("Error unliking post", error);
  }
}
