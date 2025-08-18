"use client";
import React, { useState, useEffect, use } from "react";
import Navbar from "../../components/Navbar";
import { db } from "@/lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import FileUpload from "../../components/FileUpload";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  photoURL: string;
  photoKey?: string;
  bio: string;
  coverImage: string;
  coverImageKey?: string;
}

interface ProfilePageProps {
    params: Promise<{
      id: string;
    }>;
  }

const UsersProfile = ({ params }: ProfilePageProps) => {
  const { id } = use(params);
  const { user, firestoreUser, loading, isAuthenticated } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>();
  const [displayName, setDisplayName] = useState(" ");
  const [bio, setBio] = useState(" ");
  const [coverImage, setCoverImage] = useState(" ");
  const [avatar, setAvatar] = useState(" ");
  const [editToggle, setEditToggle] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [newCoverImageUrl, setNewCoverImageUrl] = useState("");
  const [newAvatarKey, setNewAvatarKey] = useState("");
  const [newCoverImageKey, setNewCoverImageKey] = useState("");

  //   check if its the current user's profile
  const itsOwnProfile = user?.uid === id;

  useEffect(() => {
    if (!id) return;

    const userRef = doc(db, "users", id);

    // Set up real-time listener
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as User;
        setProfileUser(data);
        setDisplayName(data.username);
        setBio(data.bio);
        setCoverImage(data.coverImage);
        setAvatar(data.photoURL);
      } else {
        console.log("No such document!");
      }
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, [id]);

  const handleSave = async () => {
    try {
      if (!user?.uid) return;
      const userRef = doc(db, "users", user?.uid);
      // remove the current avatar or cover images using stored keys if available
      if (newAvatarUrl) {
        if (firestoreUser?.photoKey) {
          await removeFileByKey(firestoreUser.photoKey);
        } else if (firestoreUser?.photoURL) {
          await removeFileByUrl(firestoreUser.photoURL);
        }
      }
      if (newCoverImageUrl) {
        if (firestoreUser?.coverImageKey) {
          await removeFileByKey(firestoreUser.coverImageKey);
        } else if (coverImage) {
          await removeFileByUrl(coverImage);
        }
      }

      // Update local state with new URLs if they exist
      const updatedAvatar = newAvatarUrl || avatar;
      const updatedCoverImage = newCoverImageUrl || coverImage;

      await setDoc(
        userRef,
        {
          bio: bio || "",
          username: displayName || "",
          photoURL: updatedAvatar || "",
          photoKey: newAvatarKey || firestoreUser?.photoKey || "",
          coverImage: updatedCoverImage || "",
          coverImageKey: newCoverImageKey || firestoreUser?.coverImageKey || "",
        },
        { merge: true }
      );

      // Update local state
      setAvatar(updatedAvatar);
      setCoverImage(updatedCoverImage);
      setEditToggle(false);
      setNewAvatarUrl("");
      setNewCoverImageUrl("");
      setNewAvatarKey("");
      setNewCoverImageKey("");
    } catch (error) {
      console.error("error saving changes:", error);
    }
  };

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

  // Removing the impage(s) from R2 storage if the user decides to cancel edits
  const handleCancel = async () => {
    if (newAvatarKey) {
      await removeFileByKey(newAvatarKey);
    }
    if (newCoverImageKey) {
      await removeFileByKey(newCoverImageKey);
    }
    setEditToggle(false);
    setNewAvatarUrl("");
    setNewCoverImageUrl("");
    setNewAvatarKey("");
    setNewCoverImageKey("");
  };

  const handleAvatarUpload = (files: any[]) => {
    if (files.length > 0 && files[0].url) {
      setNewAvatarUrl(files[0].url);
      if (files[0].fileName) setNewAvatarKey(files[0].fileName);
    }
  };

  const handleCoverImageUpload = (files: any[]) => {
    if (files.length > 0 && files[0].url) {
      setNewCoverImageUrl(files[0].url);
      if (files[0].fileName) setNewCoverImageKey(files[0].fileName);
    }
  };

  if (!isAuthenticated && !itsOwnProfile) {
    return (
      <div className="flex flex-row min-h-screen">
        <Navbar />
        <div className=" font-sans flex flex-col items-center justify-items-center min-screen p-8 pb-20 ml-64 sm:p-20 w-full">
          <div className="w-full max-w-4xl">
            <h1 className="text-2xl font-bold mb-4">Sign in to create posts</h1>
            <p className=" mb-4">you need to be signed in to create a post</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-row ml-64 min-h-screen">
        <Navbar />
        <div className="font-sans flex flex-col items-center justify-center p-8 pb-20 gap-8 sm:p-20 w-full">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row ml-64 min-h-screen">
      <Navbar />
      <div className="font-sans flex flex-col p-8 pb-20 gap-8 sm:p-20 w-full ">
        <div className="">
          <div className="hero ">
            <div className="hero-content flex-col w-full bg-base-300 rounded-2xl">
              {/* Cover Image */}
              <div
                className="w-full h-80 bg-cover object-cover bg-center relative rounded-xl"
                style={{
                  backgroundImage: coverImage
                    ? `url('${profileUser.coverImage}')`
                    : `url('${profileUser.photoURL}')`,
                }}
              >
                {editToggle && itsOwnProfile && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <p className="text-lg font-semibold mb-2">Cover Image</p>
                      <FileUpload
                        onFilesUploaded={handleCoverImageUpload}
                        compact={true}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col w-full gap-4 pl-12">
                <div className="flex flex-row">
                  <div className="avatar ">
                    <div className="w-22 rounded-full absolute -top-18 ">
                      <img
                        src={
                          profileUser.photoURL ||
                          "https://pub-3d7f192d5f3e48728c4bd513008aa127.r2.dev/1754629930743-oim.jpg"
                        }
                      />
                    </div>
                  </div>
                  <h1 className="text-2xl pt-8 wrap">{profileUser.username}</h1>
                </div>
                {editToggle && itsOwnProfile ? (
                  <div>
                    <textarea
                      className="resize textarea textarea-secondary max-w-full"
                      placeholder="Bio"
                      defaultValue={profileUser.bio}
                      onChange={(e) => setBio(e.target.value)}
                    ></textarea>
                    <div className="w-80 flex flex-row items-baseline">
                      <p>avatar: </p>
                      <FileUpload
                        onFilesUploaded={handleAvatarUpload}
                        compact={true}
                      />
                    </div>
                  </div>
                ) : loading ? (
                  "loading..."
                ) : (
                  profileUser.bio || "No bio . . ."
                )}
              </div>

              {editToggle && itsOwnProfile && (
                <div className="w-full pl-12 flex flex-col gap-4">
                  <div className="justify-center flex flex-row gap-4">
                    <button
                      onClick={() => handleCancel()}
                      className="btn btn-accent"
                    >
                      cancel
                    </button>
                    <button
                      onClick={() => handleSave()}
                      className="btn btn-success"
                    >
                      save
                    </button>
                  </div>
                </div>
              )}
              {!editToggle && itsOwnProfile && (
                <button
                  onClick={() => setEditToggle(true)}
                  className="btn btn-primary"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersProfile;
