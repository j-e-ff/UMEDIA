"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Navbar from "../components/Navbar";
import { useUsers } from "../hooks/useUsers";
import { useUserIdSearch } from "../hooks/useUserIdSearch";
import { useAuth } from "@/app/context/AuthContext";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  photoURL: string;
}

interface Chat {
  chatId: string;
  participants: string[];
  lastMessage: string;
  updatedAt: Timestamp;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  seen: boolean;
}

const MessagesPage = () => {
  const {  firestoreUser, isAuthenticated, } = useAuth();
  const [searchTerm, setSearchTerm] = useState(""); // user search term
  const [messagingIds, setMessagingIds] = useState<string[]>([]); //stores the userId of messaged users
  const [message, setMessage] = useState(""); // message user is sending
  const [messages, setMessages] = useState<ChatMessage[]>([]); // entire chat log
  const users = useUsers(searchTerm); // list of all user
  const userProfiles = useUserIdSearch(messagingIds); // list of all users profiles
  const [user, setUser] = useState<User | null>(null);
  const [currentChatId, setCurrentChatId] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    const messagesContainer = messageEndRef.current?.parentElement;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  useEffect(() => {
    if (!firestoreUser?.uid) return;

    const messagingCollectionRef = collection(
      db,
      "users",
      firestoreUser.uid,
      "messagingUser"
    );
    // Listener
    const unsubscribe = onSnapshot(messagingCollectionRef, (querySnapshot) => {
      const messagingIds = querySnapshot.docs.map((doc) => doc.id);
      setMessagingIds(messagingIds);
    });

    // messages listener
    let unsubscribeMessages = () => {};
    if (currentChatId) {
      const messageQuery = query(
        collection(db, "chats", currentChatId, "message"),
        orderBy("createdAt", "asc")
      );

      unsubscribeMessages = onSnapshot(messageQuery, (snapshot) => {
        setMessages(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as ChatMessage)
          )
        );
      });
    }

    // cleanup listener when component unmounts
    return () => {
      unsubscribe();
      unsubscribeMessages();
    };
  }, [firestoreUser?.uid, currentChatId]);

  async function messageUser(currentUserId: string, targetUser: User) {
    setSearchTerm("");
    setUser(targetUser);
    const docRef = doc(
      db,
      "users",
      currentUserId,
      "messagingUser",
      targetUser.id
    );
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const chatId = [currentUserId, targetUser.id].sort().join("_");
      setCurrentChatId(chatId);

      // Create the document in /chats
      await setDoc(doc(db, "chats", chatId), {
        participants: [currentUserId, targetUser.id],
        lastMessage: "",
        updatedAt: serverTimestamp(),
      });

      console.log("Current Chat ID:", chatId);
      if (messagingIds.includes(chatId)) return;

      // add to messagingUser subcollection in firestore
      await setDoc(
        doc(db, "users", currentUserId, "messagingUser", targetUser.id),
        { chatId, messagedAt: serverTimestamp() }
      );

      // add to targetUser
      await setDoc(
        doc(db, "users", targetUser.id, "messagingUser", currentUserId),
        { chatId, messagedAt: serverTimestamp() }
      );
    } else {
      // after doc is created, find userID of the clicked user (chat) and find userID in subcollection to get chatID
      const data = docSnap.data() as Chat;
      setCurrentChatId(data.chatId);
      console.log("Chat ID:", currentChatId);
      console.log("Chat already exists, skipping creation");
    }
  }

  async function sendMessage(
    chatId: string,
    senderId: string,
    text: string,
    currentUserID: string
  ) {
    if (!user) return;

    const messageRef = collection(db, "chats", chatId, "message");

    await addDoc(messageRef, {
      senderId,
      text,
      createdAt: serverTimestamp(),
      seen: false,
    });
    // update chat metadata
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      participants: [senderId, currentUserID],
      lastMessage: text,
      updatedAt: serverTimestamp(),
    });
  }

  // check if enter key is pressed to send the message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && message.trim() !== "") {
      e.preventDefault();
      console.log("sent message:", message);
      // send message to firestore DB
      sendMessage(currentChatId, firestoreUser!.uid, message, user!.id);
      setMessage("");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-row">
        <Navbar />
        <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-4 pb-20 ml-16 sm:ml-20 md:ml-20 lg:ml-20 xl:ml-64 w-full max-w-none posting-container">
          <div className="w-full max-w-4xl px-4">
            <h1 className="text-2xl font-bold mb-4 xl:text-4xl">Sign in to create posts</h1>
            <p className="text-gray-600 mb-4 xl:text-2xl">
              you need to be signed in to create a post
            </p>
            <button
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="btn bg-white  text-black border-[#e5e5e5] xl:btn-lg "
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
      <div className="font-sans flex flex-row h-screen pt-12 pl-6 w-full gap-4 overflow-hidden xl:ml-64 ml-20">
        <div className="w-100 flex flex-col gap-4">
          <p className="text-4xl text-center">Messages</p>
          <label className="input input-primary xl:input-lg">
            <svg
              className="h-[1em] opacity-50 "
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </g>
            </svg>
            <input
              type="search"
              required
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="grow"
            />
          </label>
          {currentChatId && (
            <div className="text-center text-sm bg-secondary text-secondary-content p-2 rounded-lg xl:text-2xl">
              Active chat: {user?.username}
            </div>
          )}
          {searchTerm && (
            <div className="w-full">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between pt-4 pb-4 pl-2 rounded-lg hover:bg-primary hover:cursor-pointer transition-colors"
                  onClick={() => messageUser(firestoreUser!.uid, user)}
                >
                  <div className="flex items-center gap-4 ">
                    <div className="relative w-12 h-12 xl:w-20 xl:h-20">
                      <Image
                        className="size-12 object-cover rounded-box"
                        src={user.photoURL}
                        alt={user.username}
                       fill
                      />
                    </div>
                    <div className="">
                      <p className="text-base font-semibold xl:text-lg">{user.username}</p>
                      <p className="text-xs wrap-anywhere xl:text-lg">{user.email}</p>
                    </div>
                  </div>
                </li>
              ))}
            </div>
          )}
          {!searchTerm && (
            <div className="w-full">
              {userProfiles.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between pt-4 pb-4 pl-2 rounded-lg hover:bg-primary hover:cursor-pointer hover:text-primary-content transition-colors"
                  onClick={() => messageUser(firestoreUser!.uid, user)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 xl:w-20 xl:h-20">
                      <Image
                        className="object-cover rounded-box"
                        src={user.photoURL}
                        alt={user.username}
                        fill
                      />
                    </div>
                    <div className="lowercase">
                      <p className="text-base font-semibold xl:text-lg">{user.username}</p>
                      <p className="text-xs wrap-anywhere xl:text-lg">{user.email}</p>
                    </div>
                  </div>
                </li>
              ))}
            </div>
          )}
        </div>
        <div className="divider divider-horizontal divider-accent"></div>
        <div className="w-full">
          {user && (
            <div>
              <div className="flex flex-row gap-4 items-center">
                <div className="relative w-16 h-16 xl:w-20 xl:h-20">
                  <Image
                    className="object-cover rounded-box"
                    src={user.photoURL}
                    alt={user.username}
                    fill
                  />
                </div>
                <p className="font-bold text-lg xl:text-4xl">{user.username}</p>
              </div>
            </div>
          )}
          {!user && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h1 className="text-4xl mb-4">Welcome to Messages</h1>
                <p>Select a user to start chatting</p>
              </div>
            </div>
          )}
          <div className="divider divider-vertical divider-accent pr-8"></div>
          {user && (
            <div className="pr-8 relative h-full pb-44">
              <div className="flex flex-col gap-2 h-full overflow-y-auto pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-lg max-w-xs  ${
                      msg.senderId === firestoreUser!.uid
                        ? "bg-primary text-primary-content ml-auto"
                        : "bg-neutral text-neutral-content"
                    }`}
                  >
                    <p className="text-base xl:text-2xl">{msg.text}</p>
                    <span className="text-xs opacity-70 xl:text-base">
                      {msg.createdAt
                        ? msg.createdAt.toDate().toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "numeric",
                            month: "short",
                            day: "2-digit",
                          })
                        : "Just now"}
                    </span>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
              <div className="absolute bottom-30 w-full pr-8 xl:bottom-40">
                <input
                  type="text"
                  placeholder="Message..."
                  className="grow input input-secondary w-full xl:input-xl"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
