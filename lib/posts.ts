import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface Post {
  userId: string;
  title: string;
  comments: string;
  photoURLs: string[];
  forumID: string;
  postID: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreatePostData {
  userId: string;
  title: string;
  comments: string;
  photoURLs: string[];
  forumID: string;
}

// Create a new post
export const createPost = async (postData: CreatePostData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update the post with its ID
    await updateDoc(doc(db, "posts", docRef.id), {
      postID: docRef.id,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

// Get a single post by ID
export const getPost = async (postId: string): Promise<Post | null> => {
  try {
    const docRef = doc(db, "posts", postId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as Post;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting post:", error);
    throw error;
  }
};

// Get all posts
export const getAllPosts = async (): Promise<Post[]> => {
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data() as Post);
  } catch (error) {
    console.error("Error getting posts:", error);
    throw error;
  }
};

// Get posts by forum
export const getPostsByForum = async (forumId: string): Promise<Post[]> => {
  try {
    const q = query(
      collection(db, "posts"),
      where("forumID", "==", forumId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data() as Post);
  } catch (error) {
    console.error("Error getting posts by forum:", error);
    throw error;
  }
};

// Get posts by user
export const getPostsByUser = async (userId: string): Promise<Post[]> => {
  try {
    const q = query(
      collection(db, "posts"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data() as Post);
  } catch (error) {
    console.error("Error getting posts by user:", error);
    throw error;
  }
};

// Update a post
export const updatePost = async (
  postId: string,
  updates: Partial<Post>
): Promise<void> => {
  try {
    const docRef = doc(db, "posts", postId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const docRef = doc(db, "posts", postId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};

// Get recent posts with limit
export const getRecentPosts = async (
  limitCount: number = 10
): Promise<Post[]> => {
  try {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data() as Post);
  } catch (error) {
    console.error("Error getting recent posts:", error);
    throw error;
  }
};
