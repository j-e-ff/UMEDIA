"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  photoURL: string;
}

export function useUserIdSearch(userIds: string[]) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if(!userIds) return;
        // firestore can only fetch up to 10 items at a time, have to create a 2D array when > 10
        const chunks = [];
        for (let i = 0; i < userIds.length; i += 30) {
          chunks.push(userIds.slice(i, i + 30));
        }

        const results: User[] = [];
        for (const chunk of chunks) {
          const q = query(
            collection(db, "users"),
            where("__name__", "in", chunk)
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((docSnap) => {
            results.push({ id: docSnap.id, ...docSnap.data() } as User);
          });
        }
        setUsers(results);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUsers();
  }, [userIds]);

  return users;
}
