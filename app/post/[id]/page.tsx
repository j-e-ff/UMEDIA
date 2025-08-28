"use client";
import React, { useState, useEffect, use } from "react";
import Navbar from "../../components/Navbar";
import { db } from "@/lib/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  writeBatch,
  collection,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { likePost } from "@/app/utils/likePost";
import { unlikePost } from "@/app/utils/unlikePost";

interface Post {
  description: string;
  createdAt: any;
  forumId: string;
  photoUrls: string[];
  postId: string;
  title: string;
  updatedAt: any;
  userId: string;
  userName: string;
  userImage?: string;
}

interface FirestoreUser {
  uid: string;
  email: string;
  username: string;
  photoURL: string;
  photoKey?: string;
  createdAt: Date;
  bio: string;
  coverImage: string;
  coverImageKey?: string;
}

interface Comment {
  comment: string;
  commentId: string;
  createdAt: Timestamp;
  userId: string;
  userName: string;
  userAvatar: string;
}

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

const PostPage = ({ params }: PostPageProps) => {
  const { id } = use(params);
  const { firestoreUser } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comment, setComment] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!id) return;

    const postRef = doc(db, "posts", id);

    // real-time listener
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Post;
        setPost(data);
      }
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    const postCommentsRef = collection(db, "posts", id, "comments");

    // real-time listener for comments
    const unsubscribe = onSnapshot(postCommentsRef, (querySnapshot) => {
      const comments: Comment[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          comment: data.comment,
          commentId: data.commentId,
          createdAt: data.createdAt,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar,
        };
      });
      setCommentsList(comments);
      console.log("Comments", comments);
    });
    return () => unsubscribe();
  }, [id]);

  // getting the subcollection of users that liked the post
  useEffect(() => {
    const likedPostRef = collection(db, "posts", id, "likes");

    // real-time listener
    const unsubscribe = onSnapshot(likedPostRef, (querySnapshot) => {
      const userIds = querySnapshot.docs.map((doc) => doc.id);
      if (firestoreUser) {
        setIsLiked(userIds.includes(firestoreUser.uid));
      }
    });
    return () => unsubscribe();
  }, [id, firestoreUser]);

  async function submitComment(
    comment: string,
    user: FirestoreUser,
    postId: string
  ) {
    try {
      // reference to comment subcollection
      const commentsRef = collection(db, "posts", postId, "comments");

      // create new document with commentId
      const newCommentRef = doc(commentsRef);

      const commentData = {
        comment: comment,
        commentId: newCommentRef.id,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.username,
        userAvatar: user.photoURL,
      };

      await setDoc(newCommentRef, commentData);

      // Clear the comment input after successful submission
      setComment("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting comment:", error);
      // You could add a toast notification here to show the error to the user
    }
  }

  const handleNext = () => {
    setCurrentImageIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => prev - 1);
  };

  return (
    <div className="flex flex-row ml-20 min-h-screen xl:ml-64">
      <Navbar />
      {post && (
        <div className="font-sans flex flex-col p-8 pb-20 gap-8 sm:p-20 w-full ">
          <div className="bg-neutral text-neutral-content shadow-xl overflow-hidden rounded-xl ">
            <div className="card-body h-24 overflow-y-auto ">
              <h2 className="card-title">
                <div>
                  <img
                    src={
                      post.userImage
                        ? post.userImage
                        : "https://pub-3d7f192d5f3e48728c4bd513008aa127.r2.dev/1754019117887-oim.jpg"
                    }
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                @{post.userName}: {post.title}
              </h2>
            </div>
            {post.photoUrls.length > 0 && (
              <figure className="px-6 pb-4 flex flex-col items-center ">
                <div className=" h-130 flex items-center justify-center">
                  <img
                    key={currentImageIndex} // re-trigger transition on index change
                    src={post.photoUrls[currentImageIndex]}
                    alt={`Image ${currentImageIndex + 1}`}
                    className="w-180  h-full object-contain rounded-lg "
                  />
                </div>
                <div className="flex justify-center mt-4 gap-8">
                  <button
                    onClick={handlePrev}
                    disabled={currentImageIndex === 0 ? true : false}
                    hidden={post.photoUrls.length === 1}
                    className="btn bt-sm rounded-2xl btn-secondary"
                  >
                    prev
                  </button>
                  <p className="text-xs mt-2">
                    {currentImageIndex + 1} / {post.photoUrls.length}
                  </p>
                  <button
                    onClick={handleNext}
                    disabled={
                      currentImageIndex === post.photoUrls.length - 1
                        ? true
                        : false
                    }
                    hidden={post.photoUrls.length === 1}
                    className="btn bt-sm rounded-2xl btn-secondary"
                  >
                    next
                  </button>
                </div>
              </figure>
            )}
            <div className="text-neutral-content px-6 pb-2">
              <span>{post.description}</span>
            </div>
            <div className="flex gap-4 px-6 py-4">
              {/* Like button */}
              <button
                onClick={() => {
                  if (isLiked) {
                    unlikePost(firestoreUser!.uid, id);
                  } else {
                    likePost(firestoreUser!.uid, id);
                  }
                }}
                className="btn btn-primary rounded-2xl"
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
              <button className="btn btn-primary rounded-2xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-hand-thumbs-down"
                  viewBox="0 0 16 16"
                >
                  <path d="M8.864 15.674c-.956.24-1.843-.484-1.908-1.42-.072-1.05-.23-2.015-.428-2.59-.125-.36-.479-1.012-1.04-1.638-.557-.624-1.282-1.179-2.131-1.41C2.685 8.432 2 7.85 2 7V3c0-.845.682-1.464 1.448-1.546 1.07-.113 1.564-.415 2.068-.723l.048-.029c.272-.166.578-.349.97-.484C6.931.08 7.395 0 8 0h3.5c.937 0 1.599.478 1.934 1.064.164.287.254.607.254.913 0 .152-.023.312-.077.464.201.262.38.577.488.9.11.33.172.762.004 1.15.069.13.12.268.159.403.077.27.113.567.113.856s-.036.586-.113.856c-.035.12-.08.244-.138.363.394.571.418 1.2.234 1.733-.206.592-.682 1.1-1.2 1.272-.847.283-1.803.276-2.516.211a10 10 0 0 1-.443-.05 9.36 9.36 0 0 1-.062 4.51c-.138.508-.55.848-1.012.964zM11.5 1H8c-.51 0-.863.068-1.14.163-.281.097-.506.229-.776.393l-.04.025c-.555.338-1.198.73-2.49.868-.333.035-.554.29-.554.55V7c0 .255.226.543.62.65 1.095.3 1.977.997 2.614 1.709.635.71 1.064 1.475 1.238 1.977.243.7.407 1.768.482 2.85.025.362.36.595.667.518l.262-.065c.16-.04.258-.144.288-.255a8.34 8.34 0 0 0-.145-4.726.5.5 0 0 1 .595-.643h.003l.014.004.058.013a9 9 0 0 0 1.036.157c.663.06 1.457.054 2.11-.163.175-.059.45-.301.57-.651.107-.308.087-.67-.266-1.021L12.793 7l.353-.354c.043-.042.105-.14.154-.315.048-.167.075-.37.075-.581s-.027-.414-.075-.581c-.05-.174-.111-.273-.154-.315l-.353-.354.353-.354c.047-.047.109-.176.005-.488a2.2 2.2 0 0 0-.505-.804l-.353-.354.353-.354c.006-.005.041-.05.041-.17a.9.9 0 0 0-.121-.415C12.4 1.272 12.063 1 11.5 1" />
                </svg>
              </button>
            </div>
            {firestoreUser && (
              <div className="px-6 pb-4">
                {isOpen ? (
                  <div className="border border-accent rounded">
                    <textarea
                      placeholder="Comment . . ."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="textarea textarea-secondary bg-neutral text-neutral-content w-full border-none focus:outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end py-2">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          setComment("");
                        }}
                        className="btn btn-error btn-sm rounded-2xl "
                      >
                        cancel
                      </button>
                      <button
                        disabled={comment.trim() === "" ? true : false}
                        onClick={() =>
                          submitComment(comment, firestoreUser, id)
                        }
                        className="btn btn-success btn-sm rounded-2xl"
                      >
                        submit
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn bg-neutral  text-neutral-content w-full rounded-3xl justify-start"
                    onClick={() => setIsOpen(true)}
                  >
                    Comment . . .
                  </button>
                )}
              </div>
            )}
            <div className="px-6">
              {commentsList.map((comment) => (
                <li key={comment.commentId} className="flex p-4">
                  <div className="">
                    <div className="flex items-center pb-4">
                      <img
                        src={comment.userAvatar}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="pl-2 text-lg">{comment.userName}</p>
                        <p className="text-xs pl-2">
                          {comment.createdAt
                            ? comment.createdAt.toDate().toLocaleString()
                            : "Loading..."}
                        </p>
                      </div>
                    </div>
                    <p className="px-10">{comment.comment}</p>
                  </div>
                </li>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostPage;
