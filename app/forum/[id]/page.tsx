"use client";
import React, { useState, useEffect, use } from "react";
import Navbar from "../../components/Navbar";
import { db } from "@/lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import DisplayPost from "@/app/components/DisplayPost";
import { useFollowingForums } from "@/app/hooks/useFollowingForums";
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
  const followingForums = useFollowingForums();

  
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



  if (!forum) return <div>Loading...</div>;
  return (
    <div className="flex flex-row ml-64 min-h-screen">
      <Navbar />
      <div className="font-sans flex flex-col p-8 pb-20 gap-8 sm:p-20 w-full ">
        <div>
          <div className="hero">
            <div className="hero-content flex-col w-full bg-primary rounded-2xl">
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
                  <div className="avatar">
                    <div className="w-22 rounded-full absolute -top-18">
                      <img src={forum.forumImage} alt=":(" />
                    </div>
                    <h1 className="text-2xl pt-8 wrap">{forum.name}</h1>
                  </div>
                  <button className="btn btn-square bg-base-300 border-0 hover:border-accent hover:border-2 hover:bg-base-200 ml-auto mr-20">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      className="size-[1.2em]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                      />
                    </svg>
                  </button>
                </div>
                <div>{forum.description}</div>
                <DisplayPost forumId={forum.forumId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;
