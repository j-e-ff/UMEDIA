import Link from "next/link";
import Navbar from "./components/Navbar";
import DisplayPost from "./components/DisplayPost";

export default function Home() {
  return (
    <div className="flex flex-row ml-64">
      <Navbar/>
      <div className="font-sans flex flex-col items-center justify-items-center min-h-screen sm:p-20 w-full">
        <h1>HOMEPAGE</h1>
        <DisplayPost/>
        
      </div>
    </div>
  );
}
