import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { useAuth } from "../context/AuthContext";
import { forumIdSearch } from "@/app/utils/forumIdSearch";
import { userProfilePicture } from "../utils/userProfilePicture";
import { likePost } from "@/app/utils/likePost";
import { unlikePost } from "@/app/utils/unlikePost";
import { collection, getDocs, onSnapshot, Timestamp } from "firebase/firestore";
import { profile } from "console";

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
  userImage?: string;
}

interface Forum {
  coverImage: string;
  createdAt: Date;
  createdBy: string;
  description: string;
  forumId: string;
  forumImage: string;
  name: string;
}

type PostCardProps = {
  post: Post;
  location: string;
};

const PostCard: React.FC<PostCardProps> = ({ post, location }) => {
  const { firestoreUser } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [forum, setForum] = useState<Forum | null>();
  const [fetchedForum, setFetchedForum] = useState(false);
  const [comments, setComments] = useState(0);
  const [profilePicture, setProfilePicture] = useState("");
  const [loading, setLoading] = useState(true);

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev = prev + 1));
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev = prev - 1));
  };

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        if (!post.userId) return;
        const url = await userProfilePicture(post.userId);
        if (url) {
          setProfilePicture(url);
          setLoading(false);
        } else {
          console.error("No profile picture found for user:", post.userId);
        }
      } catch (error) {
        console.error(
          "Error fetching user profile picture: ",
          error,
          post.userId
        );
      }
    };
    fetchProfilePicture();
  }, [post.userId]);

  // useEffect for getting the forum
  useEffect(() => {
    const fetchForum = async () => {
      if (post.forumId && post.forumId != "general") {
        setForum(await forumIdSearch(post.forumId));
        setFetchedForum(true);
      } else {
        setForum(null);
      }
    };
    fetchForum();
  }, [post.forumId]);

  // getting the subcollection of users that liked the post
  useEffect(() => {
    const likedPostRef = collection(db, "posts", post.postId, "likes");

    // real-time listener
    const unsubscribe = onSnapshot(likedPostRef, (querySnapshot) => {
      const userIds = querySnapshot.docs.map((doc) => doc.id);
      if (firestoreUser) {
        setIsLiked(userIds.includes(firestoreUser.uid));
      }
    });
    return () => unsubscribe();
  }, [post, firestoreUser]);

  // fetching post's comments (number) to display
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const q = collection(db, "posts", post.postId, "comments");
        const querySnapshot = await getDocs(q);
        const commentsList = querySnapshot.docs.length;
        setComments(commentsList);
      } catch (error) {
        console.log("Error fetching post comments:", error);
      }
    };
    fetchComments();
  }, [post.postId]);

  // fetching post's likes (number)
  if (post.forumId != "general" && fetchedForum == false)
    return (
      <div>
        <span className="loading loading-spinner loading-xl"></span>
      </div>
    );

  if (loading)
    return (
      <div>
        <span className="loading loading-spinner loading-xl"></span>
      </div>
    );

  if (location === "profile")
    return (
      // card container
      <div className="relative group">
        {/* card  */}
        <div className=" h-full bg-neutral text-neutral-content overflow-hidden rounded-xl hover:brightness-40">
          <div className="h-80">
            {/* title + avatar */}
            <Link href={`/post/${post.postId}`}>
              {post.forumId === "general" ? (
                <div className="flex pl-2 pt-2 ">
                  <div className="relative min-w-12 min-h-12 max-w-12 max-h-12 ">
                    {post.userImage && (
                      <Image
                        src={profilePicture}
                        fill={true}
                        alt="userImage"
                        className="rounded-full object-cover"
                        loading="eager"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="h-12 w-full overflow-y-auto">
                    <h2 className="flex pl-2 pt-2 xl:text-2xl">
                      @{post.userName}: {post.title}
                    </h2>
                  </div>
                </div>
              ) : (
                <div className="flex pl-2 pt-2 ">
                  <div className="relative min-w-12 min-h-12 max-w-12 max-h-12 ">
                    {forum?.forumImage && (
                      <Image
                        src={forum.forumImage}
                        width={720}
                        height={520}
                        alt="forumImage"
                        className="rounded-full object-cover "
                        loading="eager"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="h-10 w-full overflow-y-scroll">
                    <h2 className="pl-2 pt-2 xl:text-2xl overflow-y-hidden">
                      @{forum?.name}: {post.title}
                    </h2>
                  </div>
                </div>
              )}
            </Link>

            {/* displaying content, checking if the post has images or text based */}
            {post.photoUrls.length > 0 && (
              <div className="flex py-2">
                <figure className="relative w-100 h-64 xl:w-80 xl:h-60 2xl:w-100 2xl:h-60">
                  <div className="flex items-center justify-center ">
                    <Image
                      key={post.photoUrls[0]}
                      src={post.photoUrls[0]}
                      alt={post.postId}
                      width={720}
                      height={520}
                      className="h-64 object-contain px-2 py-2"
                      loading="eager"
                    />
                  </div>
                </figure>
              </div>
            )}
            {!(post.photoUrls.length > 0) && (
              <div className="flex flex-col h-65">
                <p className="py-4 px-4 text-lg overflow-y-auto wrap-anywhere">
                  {post.description}{" "}
                </p>
                <div className="flex justify-start mt-auto">
                  {/* Like Button */}
                  <button
                    onClick={() => {
                      if (isLiked) {
                        unlikePost(firestoreUser!.uid, post.postId);
                      } else {
                        likePost(firestoreUser!.uid, post.postId);
                      }
                    }}
                    className="btn btn-neutral rounded-full"
                  >
                    <svg
                      className="size-[1.2em]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <g
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        strokeWidth="2"
                        fill={isLiked ? "red" : "none"}
                        stroke="currentColor"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                      </g>
                    </svg>
                  </button>
                  {/* Comment Button */}
                  <Link href={`/post/${post.postId}`} passHref>
                    <button className="btn btn-neutral bg-red rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                      >
                        <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                        <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2" />
                      </svg>
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="absolute top-40 left-20 flex opacity-0 group-hover:opacity-100 gap-2 ">
            <div className="flex flex-row gap-2 text-center">
              <svg
                className="size-[1.2em] text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="-1 -2 26 26"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </g>
              </svg>
              <p>{}</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="-3 -2 22 22"
                className="w-6 h-6 text-white "
                fill="currentColor"
              >
                <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2" />
              </svg>
              <p className="text-white">{comments}</p>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div>
      <div className="h-full bg-neutral text-neutral-content shadow-xl overflow-hidden rounded-xl">
        <div className="card-body h-24 xl:h-28">
          <a href={`/post/${post.postId}`}>
            {post.forumId === "general" ? (
              <h2 className="card-title xl:text-2xl">
                <div className="relative w-12 h-12 xl:w-16 xl:h-16">
                  {post.userImage && (
                    <Image
                      src={profilePicture}
                      fill={true}
                      alt="userImage"
                      className=" rounded-full object-cover"
                      loading="eager"
                      unoptimized
                    />
                  )}
                </div>
                @{post.userName}: {post.title}
              </h2>
            ) : (
              <h2 className="card-title xl:text-2xl">
                <div className="relative w-12 h-12 xl:w-16 xl:h-16">
                  {forum?.forumImage && (
                    <Image
                      src={forum.forumImage}
                      width={720}
                      height={520}
                      alt="forumImage"
                      className="rounded-full object-cover"
                      loading="eager"
                      unoptimized
                    />
                  )}
                </div>
                @{forum?.name}: {post.title}
              </h2>
            )}
          </a>
        </div>

        {post.photoUrls.length > 0 && (
          <div className="flex relative">
            {/* Previous Button */}
            <button
              onClick={handlePrev}
              disabled={currentImageIndex === 0 ? true : false}
              hidden={post.photoUrls.length === 1}
              className="btn btn-lg rounded-2xl btn-neutral opacity-70 hover:opacity-100 absolute left-2 top-1/2 "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                className="bi bi-arrow-left-circle"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"
                />
              </svg>
            </button>
            <figure className="px-6  flex flex-col items-center ">
              <div className="h-130 xl:h-210 flex items-center justify-center">
                <Image
                  key={post.photoUrls[currentImageIndex]}
                  src={post.photoUrls[currentImageIndex]}
                  alt={`Image ${currentImageIndex + 1}`}
                  width={720}
                  height={520}
                  className="w-180 h-full xl:w-280 xl:h-200 object-contain rounded-lg "
                  loading="eager"
                  unoptimized
                />
              </div>
              <p className="text-xs mt-2">
                {currentImageIndex + 1} / {post.photoUrls.length}
              </p>
            </figure>
            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={
                currentImageIndex === post.photoUrls.length - 1 ? true : false
              }
              hidden={post.photoUrls.length === 1}
              className="btn btn-lg rounded-2xl btn-neutral opacity-70 absolute hover:opacity-100 right-2 top-1/2 "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                className="bi bi-arrow-right-circle"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"
                />
              </svg>
            </button>
          </div>
        )}
        {!(post.photoUrls.length > 0) && (
          <div className="w-full ">
            <div className="px-8">
              <p className="xl:text-xl">{post.description}</p>
            </div>
          </div>
        )}
        <div className="flex justify-start p-4">
          {/* Like Button */}
          <button
            onClick={() => {
              if (isLiked) {
                unlikePost(firestoreUser!.uid, post.postId);
              } else {
                likePost(firestoreUser!.uid, post.postId);
              }
            }}
            className="btn btn-neutral rounded-full"
          >
            <svg
              className="size-[1.2em]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2"
                fill={isLiked ? "red" : "none"}
                stroke="currentColor"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </g>
            </svg>
          </button>
          {/* Comment Button */}
          <Link href={`/post/${post.postId}`} passHref>
            <button className="btn btn-neutral bg-red rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                className="w-4 h-4 text-white"
                fill="currentColor"
              >
                <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2" />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
