
import Navbar from "./components/Navbar";
import HomePage from "./home/HomePage";

export default function Home() {
  return (
    <div className="flex flex-row">
      <Navbar />
      <div className=" font-sans flex flex-col items-center justify-items-center min-h-screen ml-20 lg:ml-20  sm:ml-20 sm:p-20 w-full">
        <h1>HOMEPAGE</h1>
        <HomePage/>
      </div>
    </div>
  );
}
