"use client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function followUser(currentUserId: string, targetUserId: string) {
  // add to "followingUser" subcollection in firestore
  await setDoc(doc(db, "users", currentUserId, "followingUser", targetUserId), {
    followedAt: serverTimestamp(),
  });

  // add to "followers" subcollection
  await setDoc(doc(db, "users", targetUserId, "followers", currentUserId), {
    followedAt: serverTimestamp(),
  });
}
