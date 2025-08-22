"use client";
import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { useUsers } from "../hooks/useUsers";
import { useUserIdSearch } from "../hooks/useUserIdSearch";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/lib/firebase";
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
  where,
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
  updatedAt: Date;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
  seen: boolean;
}

const MessagesPage = () => {
  const { firestoreUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState(""); // user search term
  const [messagingIds, setMessagingIds] = useState<string[]>([]); //stores the userId of messaged users
  const [message, setMessage] = useState(""); // message user is sending
  const [messages, setMessages] = useState<any[]>([]); // entire chat log
  const users = useUsers(searchTerm); // list of all user
  const userProfiles = useUserIdSearch(messagingIds); // list of all users profiles
  const [user, setUser] = useState<User | null>(null);
  const [currentChatId, setCurrentChatId] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  },[messages])

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
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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

  return (
    <div className="flex flex-row">
      <Navbar />
      <div className="font-sans flex flex-row h-screen pt-12 pl-12 w-full gap-4 overflow-hidden xl:ml-64 ml-20">
        <div className="w-100 flex flex-col gap-4">
          <p className="text-4xl text-center">Messages</p>
          <label className="input input-primary">
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
            <div className="text-center text-sm text-gray-500 bg-secondary p-2 rounded-lg">
              Active chat: {user?.username}
            </div>
          )}
          {searchTerm && (
            <div className="w-full">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between pt-4 pb-4 pl-2 rounded-lg hover:bg-secondary hover:cursor-pointer transition-colors"
                  onClick={() => messageUser(firestoreUser!.uid, user)}
                >
                  <div className="flex items-center gap-4">
                    <img
                      className="size-16 object-contain rounded-box"
                      src={user.photoURL}
                      alt={user.username}
                    />
                    <div className="uppercase">
                      <p className="text-base">{user.username}</p>
                      <p className="text-xs">{user.email}</p>
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
                  className="flex items-center justify-between pt-4 pb-4 pl-2 rounded-lg hover:bg-secondary hover:cursor-pointer transition-colors"
                  onClick={() => messageUser(firestoreUser!.uid, user)}
                >
                  <div className="flex items-center gap-4">
                    <img
                      className="size-16 object-contain rounded-box"
                      src={user.photoURL}
                      alt={user.username}
                    />
                    <div className="lowercase">
                      <p className="text-base font-semibold">{user.username}</p>
                      <p className="text-xs">{user.email}</p>
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
                <img
                  className="size-16 object-contain rounded-box"
                  src={user.photoURL}
                  alt={user.username}
                />
                <p className="font-bold text-lg">{user.username}</p>
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
              <div className="flex flex-col gap-2 h-full overflow-y-auto  pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-lg max-w-xs  ${
                      msg.senderId === firestoreUser!.uid
                        ? "bg-primary text-primary-content ml-auto"
                        : "bg-secondary text-secondary-content"
                    }`}
                  >
                    <p className="text-md">{msg.text}</p>
                    <span className="text-xs">
                      {msg.createdAt && msg.createdAt.toDate
                        ? msg.createdAt.toDate().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now"}
                    </span>
                  </div>
                ))}
                <div ref={messageEndRef}/>
              </div>
              <div className="absolute bottom-30 w-full pr-8">
                <input
                  type="text"
                  placeholder="Message..."
                  className="grow input input-secondary w-full"
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
