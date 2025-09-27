"use client"; // if this is in a Next.js app

import { useState, useEffect } from "react";

type ScreenSize = "xs" | "sm" | "md" | "lg" | "xl";

const getScreenSize = (width: number): ScreenSize => {
  if (width < 640) return "xs";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";
  return "xl";
};

const useScreenSize = (): ScreenSize => {
  // Start with a safe default for SSR (e.g., "md" or "xs")
  const [screenSize, setScreenSize] = useState<ScreenSize>("md");

  useEffect(() => {
    const updateSize = () => {
      setScreenSize(getScreenSize(window.innerWidth));
    };

    // Run once on mount
    updateSize();

    // Listen for resizes
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return screenSize;
};

export default useScreenSize;