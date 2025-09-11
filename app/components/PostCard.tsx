import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { useAuth } from "../context/AuthContext";
import { forumIdSearch } from "@/app/utils/forumIdSearch";
import { likePost } from "@/app/utils/likePost";
import { unlikePost } from "@/app/utils/unlikePost";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";

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
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { firestoreUser } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [forum, setForum] = useState<Forum | null>();
  const testpost = post;
  console.log("testPost", testpost);

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev = prev + 1));
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev = prev - 1));
  };

  // useEffect for getting the forum
  useEffect(() => {
    const fetchForum = async () => {
      if (post.forumId && post.forumId != "general") {
        setForum(await forumIdSearch(post.forumId));
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

  return (
    <div>
      <div className="h-full bg-neutral text-neutral-content shadow-xl overflow-hidden rounded-xl">
        <div className="card-body h-24 xl:h-28">
          <a href={`/umedia/post/${post.postId}`}>
            {post.forumId === "general" ? (
              <h2 className="card-title xl:text-2xl">
                <div className="relative w-12 h-12 xl:w-16 xl:h-16">
                  <Image
                    src={
                      post.userImage
                        ? post.userImage
                        : "https://cdn.rodasjeffrey.com/1754019117887-oim.jpg"
                    }
                    fill
                    alt="userImage"
                    className=" rounded-full object-cover"
                  />
                </div>
                @{post.userName}: {post.title}
              </h2>
            ) : (
              <h2 className="card-title xl:text-2xl">
                <div className="relative w-12 h-12 xl:w-16 xl:h-16">
                  <Image
                    src={
                      forum?.forumImage
                        ? forum.forumImage
                        : "https://cdn.rodasjeffrey.com/1754019117887-oim.jpg"
                    }
                    fill
                    alt="forumImage"
                    className="rounded-full object-cover"
                  />
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
                  key={currentImageIndex} // re-trigger transition on index change
                  src={post.photoUrls[currentImageIndex]}
                  alt={`Image ${currentImageIndex + 1}`}
                  width={720}
                  height={520}
                  className="w-180 h-full xl:w-280 xl:h-200 object-contain rounded-lg "
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
            <div className="px-8"><p className="xl:text-xl">{post.description}</p></div>
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
          <Link href={`umedia/post/${post.postId}`} passHref>
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
