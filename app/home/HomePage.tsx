"use client";
import DisplayPost from "../components/DisplayPost";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const HomePage = () => {
  const { firestoreUser} = useAuth();
  const [following, setFollowing] = useState([""]);

  // useEffect for fetching followingForums
  useEffect(() => {
    const fetchFollowingForums = async () => {
      if (!firestoreUser) return;
      try {
        const followingForumsColelctionRef = collection(
          db,
          "users",
          firestoreUser.uid,
          "followingForum"
        );

        const querySnapshot = await getDocs(followingForumsColelctionRef);

        //explicitly map the fields into the FollowingForum interface
        const followingForums = querySnapshot.docs.map(
          (doc) => doc.id
        );
        setFollowing(followingForums);
      } catch (error) {
        console.error("Failed to fetch following forums", error);
      }
    };
    fetchFollowingForums();
  }, [firestoreUser]);

  return <DisplayPost forumId={following} location="home" />;
};

export default HomePage;
