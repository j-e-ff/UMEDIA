"use client";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function userProfilePicture(userId: string) {
  if (!userId) return null;

  try {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.photoURL || null;
    }
  } catch (error) {
    console.error("Error fetching user profile picture:", error, userId);
  }
  return null;
}
