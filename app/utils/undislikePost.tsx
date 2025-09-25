"use client";
import { db } from "@/lib/firebase";
import { writeBatch, collection, doc } from "firebase/firestore";

export async function undislikePost(userId: string, postId: string) {
  try {
    const batch = writeBatch(db);
    
    // User's dislike subcollection
    const userDislikeRef = doc(
      collection(db, "users", userId, "dislikes"),
      postId
    );
    batch.delete(userDislikeRef);

    // Post's dislike subcollection
    const postDislikeRef = doc(
      collection(db, "posts", postId, "dislikes"),
      userId
    );
    batch.delete(postDislikeRef);

    await batch.commit();
  } catch (error) {
    console.error("Error with batchWrite (undislikePost)", error);
  }
}
