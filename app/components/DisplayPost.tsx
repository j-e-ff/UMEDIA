"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import PostCard from "./PostCard";

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
  forumId: string[];
  location: string;
}

const DisplayPost = ({ forumId, location }: DisplayPostProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [forumPosts, setForumPosts] = useState<Post[]>([]);
  const [displayType, setDisplayType] = useState<"general" | "forums">(
    "general"
  );
  const postsToDisplay =
    displayType === "general" && location === "home" ? posts : forumPosts;

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        if (location === "home") {
          const q = query(
            collection(db, "posts"),
            where("forumId", "==", "general"),
            orderBy("createdAt", "desc")
          );

          const querySnapshot = await getDocs(q);
          const postsList: Post[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Post),
          }));
          console.log("User posts: ", postsList);
          setPosts(postsList);
          fetchForumPosts(forumId);
          console.log("forumIds: ", forumId);
        } else {
          const q = query(
            collection(db, "posts"),
            where("forumId", "in", forumId),
            orderBy("createdAt", "desc")
          );

          const querySnapshot = await getDocs(q);
          const postsList: Post[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Post),
          }));
          console.log("Forum posts: ", postsList);
          setForumPosts(postsList);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    fetchAllPosts();
  }, [forumId, location]);

  async function fetchForumPosts(forumIds: string[]) {
    try {
      const q = query(
        collection(db, "posts"),
        where("forumId", "in", forumIds),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const postList: Post[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Post),
      }));
      console.log("forumPosts: ", postList);
      setForumPosts(postList);
    } catch (error) {
      console.error("error fetching forum posts", error);
    }
  }

  return (
    <div className="font-sans flex flex-col items-center  min-screen sm:p-20 w-full gap-10">
      {location === "home" && (
        <div className="join join-horizontal  ">
          <button
            className={`btn join-item ${
              displayType === "general"
                ? "bg-primary text-primary-content"
                : "bg-none"
            }`}
            aria-label="Users"
            value="users"
            onClick={() => setDisplayType("general")}
          >
            Users
          </button>
          <button
            className={`btn join-item ${
              displayType === "forums"
                ? "bg-primary text-primary-content"
                : "bg-none"
            }`}
            aria-label="Forums"
            value="forums"
            onClick={() => setDisplayType("forums")}
          >
            Forums
          </button>
        </div>
      )}
      {/* Render posts based on displayType */}
      {postsToDisplay.map((post) => (
        <PostCard key={post.postId} post={post} />
      ))}
    </div>
  );
};

export default DisplayPost;
