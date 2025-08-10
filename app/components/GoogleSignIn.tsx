"use client";
import { useAuth } from "../context/AuthContext";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";

const GoogleSignIn = () => {
  const {
    user,
    firestoreUser,
    setFirestoreUser,
    loading,
    isAuthenticated,
    logout,
  } = useAuth();

  const handleLogIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { uid, email } = result.user;
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        let username: string | null = "";
        let isUnique = false;

        while (!isUnique) {
          username = prompt("Enter a userme");
          if (!username) {
            alert("username is required.");
            return;
          }
          username = username.toLowerCase();

          // Check for uniqueness
          const q = query(
            collection(db, "users"),
            where("username", "==", username)
          );
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            isUnique = true;
          } else {
            alert("That username is taken. Please try another one.");
          }
        }

        const photoURL = result.user.photoURL || "";
        await setDoc(userRef, {
          uid,
          email,
          username,
          photoURL,
          photoKey: "", // placeholder until user uploads a custom avatar
          createdAt: new Date(),
          bio: "",
          coverImage: "",
          coverImageKey: "",
        });
        // set and update context (refresh to display name)
        const newUserSnap = await getDoc(userRef);
        setFirestoreUser(newUserSnap.data());
      } else {
        console.log("User already exists:", userSnap.data());
      }
    } catch (error) {
      console.error("Login Failed:", error);
    }
  };
  const handleLogout = () => {
    logout().catch(console.error);
  };
  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {isAuthenticated ? (
        <div className="dropdown dropdown-top">
          <div
            tabIndex={0}
            role="button"
            className="card w-48 bg-base-100 shadow flex flex-row items-center gap-4 p-2 cursor-pointer"
          >
            <div className="avatar">
              <div className="w-12 rounded-full">
                <img
                  src={
                    firestoreUser?.photoURL ||
                    user?.photoURL ||
                    "https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"
                  }
                  alt="User Avatar"
                />
              </div>
            </div>
            <div>
              <p className="card-title text-xs">{firestoreUser?.username}</p>
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu dropdown-content menu-sm z-10 mt-3 w-45 rounder-box bg-base-100 p-2 shadow"
          >
            <li>
              <a href="/profile">Profile</a>
            </li>
            <li onClick={handleLogout}>
              <a>Logout</a>
            </li>
          </ul>
        </div>
      ) : (
        <button
          onClick={handleLogIn}
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
      )}
    </div>
  );
};

export default GoogleSignIn;
