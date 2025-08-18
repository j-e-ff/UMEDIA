"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import FileUpload from "../components/FileUpload";
import { useAuth } from "../context/AuthContext";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import {
  doc,
  addDoc,
  setDoc,
  getDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

interface Post {
  userId: string;
  title: string;
  comments: string;
  photoUrls: string[];
  forumId: string;
  postId: string;
  createdAt: any;
  updatedAt: any;
  userName: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  photoURL: string;
}

const Posting = () => {
  const { user, firestoreUser, loading, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [comments, setComments] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [forumId, setForumId] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data() as User;
          setUsername(userData.username);
        } else {
          console.warn("No user data found in Firestore.");
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };
    fetchAllUsers();
  }, [user]);

  // handle file uploads from FileUpload component
  const handleFilesUploaded = useCallback((files: any[]) => {
    setUploadedFiles(files);
    //extract urls from uploaded files
    const urls = files
      .filter((file) => file.status === "success")
      .map((file) => file.url);
    setPhotoUrls(urls);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !firestoreUser) {
      alert("please sign in to create a post");
      return;
    }

    if (!title.trim()) {
      alert("please enter a title");
      return;
    }

    if (!comments.trim()) {
      alert("please enter some comment");
      return;
    }
    setIsSubmitting(true);
    try {
      // create a new post document
      const postData: Omit<Post, "postId"> = {
        userId: user.uid,
        title: title.trim(),
        comments: comments.trim(),
        photoUrls: photoUrls,
        forumId: forumId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userName: username,
      };

      // add the post to firestore
      const docRef = await addDoc(collection(db, "posts"), postData);

      // update the post with its ID
      await setDoc(
        doc(db, "posts", docRef.id),
        {
          ...postData,
          postId: docRef.id,
        },
        { merge: true }
      );

      //   reset form
      setTitle("");
      setComments("");
      setForumId("general");
      setPhotoUrls([]);
      setUploadedFiles([]);

      alert("post created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-row">
        <Navbar />
        <div className=" font-sans flex flex-col items-center justify-items-center min-screen p-8 pb-20 ml-64 sm:p-20 w-full">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-row">
        <Navbar />
        <div className=" font-sans flex flex-col items-center justify-items-center min-screen p-8 pb-20 ml-64 sm:p-20 w-full">
          <div className="w-full max-w-4xl">
            <h1 className="text-2xl font-bold mb-4">Sign in to create posts</h1>
            <p className="text-gray-600 mb-4">
              you need to be signed in to create a post
            </p>
            <button
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="btn bg-white  text-black border-[#e5e5e5] text-xs"
            >
              <svg
                aria-label="Google logo"
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
              >
                <g>
                  <path d="m0 0H512V512H0" fill="#fff"></path>
                  <path
                    fill="#34a853"
                    d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"
                  ></path>
                  <path
                    fill="#4285f4"
                    d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"
                  ></path>
                  <path
                    fill="#fbbc02"
                    d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"
                  ></path>
                  <path
                    fill="#ea4335"
                    d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"
                  ></path>
                </g>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row">
      <Navbar />
      <div className=" font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 xl:ml-64 lg:ml-20 md:ml-60 sm:ml-20 xs:ml-10 sm:p-20 w-full">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Create a new post
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-secondary w-full"
                placeholder="Enter you post title"
                required
              />
            </div>

            {/* forum selection */}
            <div>
              <label
                htmlFor="forum"
                className="block text-sm font-medium  mb-2"
              >
                Forum *
              </label>
              <select
                id="forum"
                value={forumId}
                onChange={(e) => setForumId(e.target.value)}
                className="select select-secondary w-full"
                required
              >
                <option value="general">General Discussion</option>
              </select>
            </div>
            {/* content input */}
            <div>
              <label
                htmlFor="comments"
                className="block text-sm font-medium  mb-2"
              >
                Content *
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="comment section"
                className="textarea textarea-secondary w-full"
                required
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium  mb-2">
                Images (optional)
              </label>
              <FileUpload onFilesUploaded={handleFilesUploaded} />
            </div>
            {/* submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-accent"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm text-secondary">
                      Creating post
                    </span>
                  </>
                ) : (
                  "create post"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Posting;
