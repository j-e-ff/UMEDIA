"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import PostCard from "./PostCard";
import { useAuth } from "@/app/context/AuthContext";

interface Post {
  description: string;
  createdAt: Timestamp;
  forumId: string;
  photoUrls: string[];
  postId: string;
  title: string;
  updatedAt: Timestamp;
  userId: string;
  userName: string;
}

interface DisplayPostProps {
  forumId: string[];
  location: string;
}

const DisplayPost = ({ forumId, location }: DisplayPostProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { firestoreUser } = useAuth();
  const [forumPosts, setForumPosts] = useState<Post[]>([]);
  const [displayType, setDisplayType] = useState<"general" | "forums">(
    "general"
  );
  const postsToDisplay =
    displayType === "general" && location === "home" ? posts : forumPosts;

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        if (location === "home" && firestoreUser) {
          // get following users
          const followingQuery = query(
            collection(db, "users", firestoreUser.uid, "followingUser")
          );
          const followingSnapshot = await getDocs(followingQuery);
          const followingUserIds = followingSnapshot.docs.map((doc) => doc.id);

          const promises = [];

          // query for general posts from followed users only
          if (followingUserIds.length > 0) {
            // firebase limits to 30 values
            const batchSize = 30;
            for (let i = 0; i < followingUserIds.length; i += batchSize) {
              const batch = followingUserIds.slice(i, i + batchSize);
              const generalPostsFromFollowedQuery = query(
                collection(db, "posts"),
                where("forumId", "==", "general"),
                where("userId", "in", batch),
                orderBy("createdAt", "desc")
              );
              promises.push(getDocs(generalPostsFromFollowedQuery));
            }
          }

          const results = await Promise.all(promises);
          let allPosts: Post[] = [];
          // combine reults from queries
          results.forEach((querySnapshot) => {
            const posts = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as Post),
            }));
            allPosts = [...allPosts, ...posts];
          });

          // remove duplicates and sort by createdAt
          const uniquePosts = allPosts.filter(
            (post, index, self) =>
              index === self.findIndex((p) => p.postId === post.postId)
          );
          uniquePosts.sort(
            (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
          );

          console.log("user posts:", uniquePosts);
          setPosts(uniquePosts);
          if (forumId.length > 0) {
            fetchForumPosts(forumId);
          }
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
  }, [forumId, location, firestoreUser]);

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

  async function displayPost(displayType: string) {
    if (displayType === "general") {
      if (posts.length > 0) {
        postsToDisplay.map((post) => (
          <PostCard key={post.postId} post={post} />
        ));
      } else {
        return (
          <div>
            <p>Follow users to see posts</p>
          </div>
        );
      }
    } else {
      if (forumPosts.length > 0) {
        postsToDisplay.map((post) => (
          <PostCard key={post.postId} post={post} />
        ));
      } else {
        <div>
          <p>Follow forums to see posts</p>
        </div>;
      }
    }
  }

  return (
    <div className="font-sans flex flex-col items-center min-screen w-full gap-10 pb-20">
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
          {forumPosts.length > 0 && (
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
          )}
        </div>
      )}
      {/* Render posts based on displayType */}
      {displayType === "general" && postsToDisplay.length == 0 ? (
        <p>Follow Users to see posts</p>
      ) : (
        postsToDisplay.map((post) => <PostCard key={post.postId} post={post} />)
      )}
    </div>
  );
};

export default DisplayPost;
