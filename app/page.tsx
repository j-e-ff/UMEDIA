import Link from "next/link";
import Navbar from "./components/Navbar";
import DisplayPost from "./components/DisplayPost";

export default function Home() {
  return (
    <div className="flex flex-row">
      <Navbar/>
      <div className=" font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 xl:ml-64 lg:ml-20 md:ml-60 sm:ml-20 xs:ml-10 sm:p-20 w-full">
        <h1>HOMEPAGE</h1>
        <DisplayPost/>
      </div>
    </div>
  );
}
