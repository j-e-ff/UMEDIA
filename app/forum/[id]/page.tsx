"use client";
import React, { useState, useEffect, use } from "react";
import Navbar from "../../components/Navbar";
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
  createdAt: any;
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

const ForumPage = ({ params }: ForumPageProps) => {
  const { id } = use(params);
  const { user, firestoreUser, loading, isAuthenticated } = useAuth();
  const [forum, setForum] = useState<Forum | null>(null);
  const [coverImage, setCoverImage] = useState("");
  const [description, setDescription] = useState("");
  const [forumImage, setForumImage] = useState("");
  const [followingForums, setFollowingForums] = useState([""]);

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

  if (!forum) return <div>Loading...</div>;

  return (
    <div className="flex flex-row min-h-screen">
      <Navbar />
      <div className=" font-sans flex flex-col items-center justify-items-center min-screen p-8 pb-20 ml-20 xl:ml-64  w-full">
        <div>
          <div className="hero">
            <div className="hero-content flex-col w-full bg-base-300 rounded-2xl">
              {/* Cover Image */}
              <div
                className="w-full h-80 bg-cover object-cover bg-center relative rounded-xl"
                style={{
                  backgroundImage: coverImage
                    ? `url('${forum.coverImage}')`
                    : `url('${forum.forumImage}')`,
                }}
              ></div>
              <div className="flex flex-col w-full gap-4 pl-12">
                <div className="flex flex-row">
                  <div className="avatar ">
                    <div className="w-22 rounded-full absolute -top-18">
                      <img src={forum.forumImage} alt=":(" />
                    </div>
                    <h1 className="text-2xl pt-8 wrap">{forum.name}</h1>
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={() =>
                        followingForums.includes(forum.forumId)
                          ? unfollowForum()
                          : followForum()
                      }
                      className="btn btn-circle ml-auto mr-12 bg-transparent border-none"
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
                  )}
                </div>
                <div>{forum.description}</div>
                <DisplayPost forumId={[forum.forumId]} location="forum" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;
