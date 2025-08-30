"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

//  created FirestoreUser to save information (mainly username) to database
//  firebase already saves uid,email,photourl but saving it to firestore can allow
//  users to change their profile photo
interface FirestoreUser {
  uid: string;
  email: string;
  username: string;
  photoURL: string;
  photoKey?: string;
  createdAt: Date;
  bio: string;
  coverImage: string;
  coverImageKey?: string;
}

interface AuthContextType {
  user: User | null;
  firestoreUser: FirestoreUser | null;
  setFirestoreUser: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be use within an AithProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // if user is signed in, try to fetch additional information from firestore
        try {
          const userRef = doc(db, "users", user.uid);
          // fetching the actual document snapshot from firestore (if exists)
          const userSnap = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              setFirestoreUser(docSnap.data() as FirestoreUser);
            } else {
              setFirestoreUser(null);
            }
          });
          setLoading(false);
          return () => unsubscribe();
        } catch (error) {
          console.error("Error fetching user data:", error);
          setFirestoreUser(null);
        }
      } else {
        setFirestoreUser(null);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const value: AuthContextType = {
    user,
    firestoreUser,
    setFirestoreUser,
    loading,
    isAuthenticated: !!user,
    logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
