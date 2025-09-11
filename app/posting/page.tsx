"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import FileUpload from "../components/FileUpload";
import { useAuth } from "../context/AuthContext";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useFollowingForums } from "../hooks/useFollowingForums";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  photoURL: string;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  fileName?: string; // The actual object key stored in R2
  status: "uploading" | "success" | "error";
  progress: number;
}

// interface user only for fetching forums user follows
interface FollowingForum {
  forumId: string;
  forumName: string;
  followedAt: Timestamp;
}

const Posting = () => {
  const { user, firestoreUser, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [forumId, setForumId] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const [forumToggle, setForumToggle] = useState(false);
  const [forumName, setForumName] = useState("");
  const [forumDesc, setForumDesc] = useState("");
  const [forumCoverImage, setForumCoverImage] = useState("");
  const [forumImage, setForumImage] = useState("");
  const followingForums = useFollowingForums();

  // DELETE FORUMS LIST AFTER COMPARING WITH USEFOLLOWINGFORUMS HOOK
  const [forumsList, setForumsList] = useState<FollowingForum[]>([]);

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
        const followingForums: FollowingForum[] = querySnapshot.docs.map(
          (doc) => {
            const data = doc.data();
            return {
              forumId: doc.id,
              forumName: data.forumName,
              followedAt: data.followedAt,
            };
          }
        );
        setForumsList(followingForums);
        console.log("followingForums", followingForums);
        console.log("forumsList", forumsList);
      } catch (error) {
        console.error("Failed to fetch following forums", error);
      }
    };
    fetchFollowingForums();
  }, [firestoreUser]);

  // handle file uploads from FileUpload component
  const handleFilesUploaded = useCallback(
    (files: UploadedFile[]) => {
      //extract urls from uploaded files
      const urls = files
        .filter((file) => file.status === "success")
        .map((file) => file.url);
      {
        forumToggle ? setForumCoverImage(urls[0]) : setPhotoUrls(urls);
      }
    },
    [forumToggle]
  );

  const handleForumImageUploaded = useCallback((files: UploadedFile[]) => {
    //extract urls from uploaded files
    const urls = files
      .filter((file) => file.status === "success")
      .map((file) => file.url);
    setForumImage(urls[0]);
  }, []);

  const handleForumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumName.trim()) {
      alert("please enter a name for your forum");
      return;
    }
    if (!forumDesc.trim()) {
      alert("please enter a description for your forum");
      return;
    }
    setIsSubmitting(true);
    try {
      //create forum document
      const forumData = {
        name: forumName,
        description: forumDesc,
        createdAt: serverTimestamp(),
        createdBy: firestoreUser!.uid,
        coverImage: forumCoverImage,
        forumImage: forumImage,
      };

      const docRef = await addDoc(collection(db, "forums"), forumData);

      // update the forum with its ID
      await setDoc(
        doc(db, "forums", docRef.id),
        {
          ...forumData,
          forumId: docRef.id,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error creating forum:", error);
    } finally {
      setIsSubmitting(false);
    }
    setForumCoverImage("");
    setForumDesc("");
    setForumName("");
  };

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

    setIsSubmitting(true);
    try {
      // create a new post document
      const postData = {
        userId: user.uid,
        title: title.trim(),
        description: description.trim(),
        photoUrls: photoUrls,
        forumId: forumId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userName: username,
        userImage: firestoreUser.photoURL,
        likes: 0,
        dislikes: 0,
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
      setDescription("");
      setForumId("general");
      setPhotoUrls([]);
      setUploadedFiles([]);

      // Redirect to homepage with success parameter
      router.push("/?postCreated=true");
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
        <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-4 pb-20 ml-16 sm:ml-20 md:ml-20 lg:ml-20 xl:ml-64 w-full max-w-none posting-container">
          <div className="w-full max-w-4xl px-4">
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
      <div className="xl:text-2xl font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 ml-20 xl:ml-64 lg:ml-20 md:ml-20 sm:ml-20 w-full max-w-none">
        <div className="w-full max-w-4xl">
          <h1 className="mb-8 text-center">
            Create a new {forumToggle ? "forum" : "post"}
          </h1>

          <div className="join join-horizontal flex justify-center">
            <button
              className={`btn join-item xl:btn-lg ${
                forumToggle == false
                  ? "bg-primary text-primary-content "
                  : "bg-none "
              }`}
              aria-label="Users"
              value="Users"
              onClick={() => setForumToggle(false)}
            >
              Users
            </button>
            <button
              className={`btn join-item xl:btn-lg ${
                forumToggle == true
                  ? "bg-primary text-primary-content"
                  : "bg-none"
              }`}
              aria-label="Forums"
              value="Forums"
              onClick={() => (
                setForumToggle(true), console.log("forumToggle", forumToggle)
              )}
            >
              Forums
            </button>
          </div>
          {!forumToggle && (
            <form onSubmit={handleSubmit} className="space-y-6 ">
              {/* Title Input */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-md font-medium mb-2 "
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input input-secondary w-full max-w-full min-w-0 xl:input-lg"
                  placeholder="Enter your post title"
                  required
                />
              </div>

              {/* forum selection */}
              <div>
                <label
                  htmlFor="forum"
                  className="block text-md font-medium mb-2"
                >
                  Forum *
                </label>
                <select
                  id="forum"
                  value={forumId}
                  onChange={(e) => setForumId(e.target.value)}
                  className="select select-secondary w-full max-w-full min-w-0 xl:input-lg"
                  required
                >
                  <option value="general">General Discussion</option>
                  {followingForums.map((forum) => {
                    return (
                      <option key={forum.forumId} value={forum.forumId}>
                        {forum.forumName}
                      </option>
                    );
                  })}
                </select>
              </div>
              {/* description input */}
              <div>
                <label
                  htmlFor="Description"
                  className="block text-md font-medium mb-2"
                >
                  Content (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="description section"
                  className="textarea textarea-secondary w-full xl:textarea-lg"
                  required
                ></textarea>
              </div>
              <div>
                <label className="block text-md font-medium mb-2 ">
                  Images (optional)
                </label>
                <FileUpload onFilesUploaded={handleFilesUploaded} />
              </div>
              {/* submit button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-success xl:btn-lg"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm text-secondary">
                        creating Post
                      </span>
                    </>
                  ) : (
                    "create post"
                  )}
                </button>
              </div>
            </form>
          )}
          {forumToggle && (
            <form onSubmit={handleForumSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="Name"
                  className="block text-md font-medium mb-2 "
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="Name"
                  value={forumName}
                  onChange={(e) => setForumName(e.target.value)}
                  className="input input-secondary w-full max-w-full min-w-0 xl:input-lg"
                  placeholder="Enter forum name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="Description"
                  className="block text-md font-medium mb-2"
                >
                  Description *
                </label>
                <input
                  type="text"
                  id="Description"
                  value={forumDesc}
                  onChange={(e) => setForumDesc(e.target.value)}
                  className="input input-secondary w-full max-w-full min-w-0 xl:input-lg"
                  placeholder="Enter forum description"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="Cover Image"
                  className="block text-md font-medium mb-2"
                >
                  Cover Image *
                </label>
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  compact={true}
                  required={true}
                />
              </div>
              <div>
                <label
                  htmlFor="Avatar"
                  className="block text-md font-medium mb-2"
                >
                  Avatar *
                </label>
                <FileUpload
                  onFilesUploaded={handleForumImageUploaded}
                  compact={true}
                  required={true}
                />
              </div>
              {/* submit button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-success xl:btn-lg"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm text-secondary">
                        creating forum
                      </span>
                    </>
                  ) : (
                    "create forum"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Posting;
