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

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  photoURL: string;
}

export function useUsers(userName: string) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          orderBy("username"),
          startAt(userName),
          endAt(userName + "\uf8ff")
        );
        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<User, "id">),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchAllUsers();
  }, [userName]);

  return users;
}
