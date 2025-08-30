"use client";
import React, { useState, useEffect, use } from "react";
import Navbar from "../../components/Navbar";
import { db } from "@/lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useFollowingForums } from "@/app/hooks/useFollowingForums";
import { useFollowingUsers } from "@/app/hooks/useFollowingUsers";
import { followUser } from "../../utils/followUser";
import { unfollowUser } from "../../utils/unfollowUser";
import { followForum } from "../../utils/followForum";
import { unfollowForum } from "../../utils/unfollowForum";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";

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

interface Forum {
  coverImage: string;
  createdAt: string;
  createdBy: string;
  description: string;
  forumId: string;
  name: string;
  forumImage: string;
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

  const [followingForums, setFollowingForums] = useState([""]);

  //search toggle
  const [displayType, setDisplayType] = useState<"Users" | "Forums">("Users");

  // varibale for storing the following users as User objects
  const [userList, setUserList] = useState<any[]>([]);
  const [forumsList, setForumsList] = useState<any[]>([]);
  // getting the list of users in the usbcollection (ids are returned a string array)
  const followingUserIdList = useFollowingUsers();
  const followingForumsList = useFollowingForums();
  const following = useFollowingUsers();

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

  const fetchUsersByIds = async (userIds: string[]) => {
    const chunks = [];
    for (let i = 0; i < userIds.length; i += 30) {
      chunks.push(userIds.slice(i, i + 30));
    }

    const results: User[] = [];
    for (const chunk of chunks) {
      const q = query(collection(db, "users"), where("__name__", "in", chunk));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
    }
    setUserList(results);
  };

  const fetchForumsByIds = async (forums: any[]) => {
    // Extract the forumIds from the object (forums)
    const forumIds = forums.map((f) => f.forumId);
    const chunks = [];
    for (let i = 0; i < forumIds.length; i += 30) {
      chunks.push(forumIds.slice(i, i + 30));
    }

    const results: Forum[] = [];
    for (const chunk of chunks) {
      const q = query(collection(db, "forums"), where("__name__", "in", chunk));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Forum;
        results.push({ ...data, forumId: docSnap.id } as Forum);
      });
    }
    console.log("results:", results);
    setForumsList(results);
  };

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
    <div className="flex flex-row ml-20 min-h-screen xl:ml-64">
      <Navbar />
      <div className="font-sans flex flex-col p-8 pb-20 gap-8 sm:p-20 w-full ">
        <div>
          <div className="hero">
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
                  <div className="ml-auto pr-4 ">
                    {itsOwnProfile && !editToggle && (
                      <button
                        className="btn btn-primary rounded-full"
                        onClick={() => {
                          const modal = document.getElementById(
                            "following"
                          ) as HTMLDialogElement | null;
                          if (modal) modal.showModal();
                          fetchUsersByIds(followingUserIdList);
                          fetchForumsByIds(followingForumsList);
                        }}
                      >
                        check following
                      </button>
                    )}
                    {isAuthenticated && !editToggle && !itsOwnProfile && (
                       <button
                        onClick={() =>
                          followingUserIdList.includes(id)
                            ? followUser(firestoreUser!.uid,id)
                            : unfollowUser(firestoreUser!.uid,id)
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
                              followingUserIdList.includes(id)
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
                  <dialog id="following" className="modal">
                    <div className="modal-box w-11/12 max-w-2xl">
                      <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                          ✕
                        </button>
                      </form>
                      <h3 className="font-bold text-lg ">Following</h3>
                      {/* Buttons */}
                      <div className="join join-horizontal flex justify-center my-4">
                        <button
                          className={`btn join-item ${
                            displayType === "Users"
                              ? "bg-primary text-primary-content"
                              : "bg-none"
                          }`}
                          aria-label="Users"
                          value="users"
                          onClick={() => setDisplayType("Users")}
                        >
                          Users
                        </button>
                        <button
                          className={`btn join-item ${
                            displayType === "Forums"
                              ? "bg-primary text-primary-content"
                              : "bg-none"
                          }`}
                          aria-label="Forums"
                          value="forums"
                          onClick={() => setDisplayType("Forums")}
                        >
                          Forums
                        </button>
                      </div>
                      <ul className="list w-full rounded-2xl shadow-md bg-base-200">
                        <li className="p-4 pb-2 text-xs tracking-wide">
                          Followed{" "}
                          {displayType === "Users" ? "Users" : "Forums"}
                        </li>
                        {displayType === "Users" &&
                          userList.map((user) => (
                            <li
                              key={user.id}
                              onClick={() =>
                                (window.location.href = `/profile/${user.id}`)
                              } // whole row navigates
                              className="flex items-center justify-between cursor-pointer py-2 px-4 hover:bg-primary hover:text-primary-content"
                            >
                              <div className="flex items-center gap-4 ">
                                <img
                                  className="size-16 object-contain rounded-box"
                                  src={user.photoURL}
                                  alt={user.username}
                                />
                                <div>
                                  <p className="text-base">{user.username}</p>
                                  <p className="uppercase text-xs">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                              {isAuthenticated &&
                                  firestoreUser?.uid !== user.id && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        following.includes(user.id)
                                          ? unfollowUser(
                                              firestoreUser?.uid!,
                                              user.id
                                            )
                                          : followUser(
                                              firestoreUser?.uid!,
                                              user.id
                                            );
                                      }}
                                      className="btn btn-circle bg-transparent border-none "
                                    >
                                      <svg
                                        className="size-[1.2em] hover:size-[1.7em]"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                      >
                                        <g
                                          strokeLinejoin="round"
                                          strokeLinecap="round"
                                          strokeWidth="2"
                                          fill={
                                            following.includes(user.id)
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
                            </li>
                          ))}
                        {displayType === "Forums" &&
                          forumsList.map((forum) => (
                            <li
                              key={forum.forumId}
                              onClick={() =>
                                (window.location.href = `/forum/${forum.forumId}`)
                              } //entire row navigates
                              className="flex items-center justify-between cursor-pointer py-2 px-4 hover:bg-primary hover:text-primary-content"
                            >
                              <div className="flex items-center gap-4 ">
                                <img
                                  className="size-16 object-contain rounded-box"
                                  src={forum.forumImage}
                                  alt={forum.forumName}
                                />
                                <p className="text-base">{forum.name}</p>
                              </div>
                              {isAuthenticated && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    followingForums.includes(forum.forumId)
                                      ? unfollowForum(
                                          firestoreUser?.uid!,
                                          forum.forumId
                                        )
                                      : followForum(firestoreUser?.uid!, forum);
                                  }}
                                  className="btn btn-circle ml-16 bg-transparent border-none"
                                >
                                  <svg
                                    className="size-[1.2em] hover:size-[1.9em] "
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
                            </li>
                          ))}
                      </ul>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                      <button>close</button>
                    </form>
                  </dialog>
                  {/*  */}
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
                      className="btn btn-error"
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
                  className="btn btn-primary rounded-2xl"
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
