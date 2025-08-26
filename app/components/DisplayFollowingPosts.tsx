"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import PostCard from "./PostCard";
import { useFollowingForums } from "../hooks/useFollowingForums";

interface Post {
  comments: string;
  createdAt: any;
  forumId: string;
  photoUrls: string[];
  postId: string;
  title: string;
  updatedAt: any;
  userId: string;
  userName: string;
}

interface DisplayPostProps {
  forumIds: string [];
}

const DisplayFollowingPosts = ({ forumIds }: DisplayPostProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
 

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const q = query(
          collection(db, "posts"),
          where("forumId", "in", forumIds),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const postsList: Post[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Post),
        }));

        setPosts(postsList);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    fetchAllPosts();
  }, []);

  return (
    <div className="flex flex-row">
      <div className=" font-sans flex flex-col items-center justify-items-center min-screen p-8 pb-20 sm:p-20 w-full gap-10">
        {posts.map((post) => (
          <PostCard key={post.postId} post={post} />
        ))}
      </div>
    </div>
  );
};

export default DisplayFollowingPosts;
