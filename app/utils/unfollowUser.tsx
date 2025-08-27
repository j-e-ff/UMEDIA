"use client";
import React from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
) {
  // Remove targetUserId from currentUserId's followingUser subcollection
  await deleteDoc(
    doc(db, "users", currentUserId, "followingUser", targetUserId)
  );

  // Remove currentUserId from targetUserId's followers subcollection
  await deleteDoc(doc(db, "users", targetUserId, "followers", currentUserId));
}
