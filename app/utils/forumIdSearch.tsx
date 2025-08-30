"use client";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Forum {
  coverImage: string;
  createdAt: any;
  createdBy: string;
  description: string;
  forumId: string;
  forumImage: string;
  name: string;
}

export async function forumIdSearch(forumId: string): Promise<Forum | null> {
  try {
    if (!forumId) return null;

    const forumRef = doc(db, "forums", forumId);
    const docSnap = await getDoc(forumRef);

    if (docSnap.exists()) {
      return { forumId: docSnap.id, ...docSnap.data() } as Forum;
    }
    return null;
  } catch (error) {
    console.error("Error fetching forum:", error, forumId);
    return null;
  }
}
