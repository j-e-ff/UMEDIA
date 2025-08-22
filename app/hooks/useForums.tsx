"use client";
import { useEffect, useState } from "react";
import {
  collection,
  endAt,
  getDocs,
  orderBy,
  query,
  startAt,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Forum {
  coverImage: string;
  createdAt: string;
  createdBy: string;
  description: string;
  forumId: string;
  name: string;
  forumImage: string;
}

export function useForums(searchTerm: string) {
  const [forums, setForums] = useState<Forum[]>([]);

  useEffect(() => {
    const fetchForums = async () => {
      try {
        const q = query(
          collection(db, "forums"),
          orderBy("name"),
          startAt(searchTerm),
          endAt(searchTerm + "\uf8ff")
        );
        const querySnapshot = await getDocs(q);
        const forumsList = querySnapshot.docs.map((doc) => ({
          forumId: doc.id,
          ...(doc.data() as Omit<Forum, "forumId">),
        }));
        setForums(forumsList);
      } catch (error) {
        console.error("Error fetching forums:", error);
      }
    };
    fetchForums();
  }, [searchTerm]);

  return forums;
}
