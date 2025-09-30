"use client";
import React, { useState, useEffect, use } from "react";
import Navbar from "../../components/Navbar";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import DisplayPost from "@/app/components/DisplayPost";
import FileUpload from "../../components/FileUpload";

interface Forum {
  coverImage: string;
  createdAt: Date;
  createdBy: string;
  description: string;
  forumId: string;
  forumImage: string;
  name: string;
}

interface ForumPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  fileName?: string; // The actual object key stored in R2
  status: "uploading" | "success" | "error";
  progress: number;
}

const ForumPage = ({ params }: ForumPageProps) => {
  const { id } = use(params);
  const { firestoreUser, isAuthenticated } = useAuth();
  const [forum, setForum] = useState<Forum | null>(null);
  const [coverImage, setCoverImage] = useState("");
  const [description, setDescription] = useState("");
  const [forumImage, setForumImage] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [newCoverImageUrl, setNewCoverImageUrl] = useState("");
  const [newCoverImage, setNewCoverImage] = useState("");
  const [followingForums, setFollowingForums] = useState([""]);
  const [isEditing, setIsEditing] = useState(false);

  const handleCoverImageUpload = (files: UploadedFile[]) => {
    if (files.length > 0 && files[0].url) {
      setNewCoverImageUrl(files[0].url);
      if (files[0].fileName) setNewCoverImage(files[0].fileName);
    }
  };

  const handleAvatarUpload = (files: UploadedFile[]) => {
    if (files.length > 0 && files[0].url) {
      setNewAvatarUrl(files[0].url);
    }
  };

  useEffect(() => {
    if (!id) return;

    const forumRef = doc(db, "forums", id);

    // set up real-time listener
    const unsubscribe = onSnapshot(forumRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Forum;
        setForum(data);
        setCoverImage(data.coverImage);
        setDescription(data.description);
        setForumImage(data.forumImage);
      }
    });

    // cleanup listener when component unmounts
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!firestoreUser?.uid) return;
    const followingForumsColelctionRef = collection(
      db,
      "users",
      firestoreUser.uid,
      "followingForum"
    );
    const unsubscribe = onSnapshot(
      followingForumsColelctionRef,
      (querySnapshot) => {
        const followingIds = querySnapshot.docs.map((doc) => doc.id);
        setFollowingForums(followingIds);
      }
    );
    return () => unsubscribe();
  }, [firestoreUser?.uid]);

  async function followForum() {
    // add to followingForums subcollection in users collection
    await setDoc(
      doc(db, "users", firestoreUser!.uid, "followingForum", forum!.forumId),
      {
        followedAt: serverTimestamp(),
        name: forum!.name,
        forumId: forum!.forumId,
      }
    );
  }

  async function unfollowForum() {
    await deleteDoc(
      doc(db, "users", firestoreUser!.uid, "followingForum", forum!.forumId)
    );
  }

  const removeFileByKey = async (key: string) => {
    try {
      const res = await fetch(
        `/api/delete-file?fileName=${encodeURIComponent(key)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        console.error("failed to delete file from storage");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const removeFileByUrl = async (url: string) => {
    const keyFromUrl = url.split("/").pop()!;
    await removeFileByKey(keyFromUrl);
  };

  const handleSave = async () => {
    try {
      if (!forum) return;
      const forumRef = doc(db, "forums", forum.forumId);

      // remove the current avatar from the forum
      if (newAvatarUrl) {
        await removeFileByUrl(forum.forumImage);
      }

      // remove the current coverImage (banner) for the forum
      if (newCoverImage) {
        await removeFileByUrl(forum.coverImage);
      }

      const updatedAvatar = newAvatarUrl || forum.forumImage;
      const updatedCoverImage = newCoverImageUrl || forum.coverImage;

      await setDoc(
        forumRef,
        {
          description: description || forum.description,
          forumImage: updatedAvatar,
          coverImage: updatedCoverImage,
        },
        { merge: true }
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating forum:", error);
    }
  };

  const handleCancel = async () => {
    try {
      setNewCoverImageUrl("");
      setDescription(forum!.description);
      setForumImage("");
      setIsEditing(false);
    } catch (error) {
      console.error("Error canceling edit:", error);
    }
  };

  if (!forum) return <div>Loading...</div>;

  return (
    <div className="flex flex-row min-h-screen">
      <Navbar />
      <div className="font-sans flex flex-col items-center justify-items-center min-screen pb-20 sm:ml-20 xl:ml-64  w-full">
        <div>
          <div className="hero w-full sm:min-w-120 md:min-w-160 lg:min-w-200 xl:min-w-240 2xl:min-w-300">
            <div className="hero-content w-full flex-col bg-base-300 rounded-2xl ">
              {/* Background Cover Image */}
              <div
                className="w-full h-80 bg-cover object-cover bg-center relative rounded-xl"
                style={{
                  backgroundImage: coverImage
                    ? `url('${forum.coverImage}')`
                    : `url('${forum.forumImage}')`,
                }}
              >
                {isEditing && (
                  <div className="absolute inset-0 bg-black opacity-75 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-semibold mb-2 text-white">
                        Cover Image
                      </p>
                      <FileUpload
                        onFilesUploaded={handleCoverImageUpload}
                        compact={true}
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Forum Avatar */}
              <div className="flex flex-col w-full gap-4 ">
                <div className="flex flex-row">
                  <div className="avatar">
                    <div className="w-22 rounded-full absolute -top-18 left-4">
                      <Image
                        src={forum.forumImage}
                        alt="avatar"
                        width={88}
                        height={88}
                      />
                    </div>
                  </div>
                  {/* Top section (name, following, edit ) */}
                  {isAuthenticated && (
                    <div className="flex w-full pt-4 ml-4">
                      <h1 className="text-2xl  wrap xl:text-3xl">
                        {forum.name}
                      </h1>

                      {/* display only when user is not editing */}
                      {!isEditing && (
                        <div className="flex justify-end w-full items-center">
                          <button
                            onClick={() =>
                              followingForums.includes(forum.forumId)
                                ? unfollowForum()
                                : followForum()
                            }
                            className="btn btn-circle bg-transparent border-none xl:btn-xl"
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
                                fill={
                                  followingForums.includes(forum.forumId)
                                    ? "red"
                                    : "none"
                                }
                                stroke="currentColor"
                              >
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                              </g>
                            </svg>
                          </button>
                          {/* Display Edit Button Only For Creator  */}
                          {isAuthenticated &&
                            firestoreUser?.uid === forum.createdBy && (
                              <button
                                className="btn btn-ghost rounded-full bg-transparent hover:btn-primary hover:bg-secondary 2xl:btn-lg"
                                onClick={() => setIsEditing(!isEditing)}
                              >
                                Edit Forum
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div className="flex flex-col gap-8">
                    <textarea
                      className="resize textarea textarea-secondary max-w-xl"
                      placeholder="Bio"
                      defaultValue={forum?.description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                    <div className="flex flex-row items-baseline">
                      <p className="mr-2">avatar : </p>
                      <FileUpload
                        onFilesUploaded={handleAvatarUpload}
                        compact={true}
                      />
                    </div>
                    {/* Buttons Container */}
                    <div className="flex flex-row gap-4 justify-center">
                      <button
                        className="btn btn-error"
                        onClick={() => handleCancel()}
                      >
                        cancel
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => handleSave()}
                      >
                        save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 ">
                    <p className="xl:text-xl ml-2">{forum.description}</p>
                    <DisplayPost forumId={[forum.forumId]} location="forum" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;
