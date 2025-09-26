"use client";
import Navbar from "./components/Navbar";
import HomePage from "./home/HomePage";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function HomeContent() {
  const [showToast, setShowToast] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if post was created successfully
    const postCreated = searchParams.get("postCreated");
    if (postCreated === "true") {
      setShowToast(true);

      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 4000);

      // Clean up URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("postCreated");
      window.history.replaceState({}, "", url);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-row">
      <Navbar />
      <div className="font-sans flex flex-col items-center justify-items-center min-h-screen sm:ml-20 lg:ml-30 xl:ml-55 px-2  w-full">
        {/* Toast for successful post creation */}
        {showToast && (
          <div className="toast toast-start">
            <div className="alert alert-success">
              <span>Post created!</span>
            </div>
          </div>
        )}

        <h1 className="mt-10 xl:text-xl pb-10 sm:pb-0">HOMEPAGE</h1>
        <HomePage />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
