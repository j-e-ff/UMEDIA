import React, { useState } from "react";

interface Post {
  description: string;
  createdAt: any;
  forumId: string;
  photoUrls: string[];
  postId: string;
  title: string;
  updatedAt: any;
  userId: string;
  userName: string;
  userImage?: string;
}

type PostCardProps = {
  post: Post;
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev = prev + 1));
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev = prev - 1));
  };

  return (
    <div>
      <div className="h-full bg-neutral text-neutral-content shadow-xl overflow-hidden rounded-xl ">
        <div className="card-body h-24 overflow-y-auto ">
          <a href={`/post/${post.postId}`}>
            <h2 className="card-title">
              <div>
                <img
                  src={
                    post.userImage
                      ? post.userImage
                      : "https://pub-3d7f192d5f3e48728c4bd513008aa127.r2.dev/1754019117887-oim.jpg"
                  }
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              @{post.userName}: {post.title}
            </h2>
          </a>
        </div>
        {post.photoUrls.length > 0 && (
          <figure className="px-6 pb-4 flex flex-col items-center ">
            <div className=" h-130 flex items-center justify-center">
              <img
                key={currentImageIndex} // re-trigger transition on index change
                src={post.photoUrls[currentImageIndex]}
                alt={`Image ${currentImageIndex + 1}`}
                className="w-180  h-full object-contain rounded-lg "
              />
            </div>
            <div className="flex justify-center mt-4 gap-8">
              {/* Previous Button */}
              <button
                onClick={handlePrev}
                disabled={currentImageIndex === 0 ? true : false}
                hidden={post.photoUrls.length === 1}
                className="btn bt-sm rounded-2xl btn-secondary"
              >
                prev
              </button>
              <p className="text-xs mt-2">
                {currentImageIndex + 1} / {post.photoUrls.length}
              </p>
              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={
                  currentImageIndex === post.photoUrls.length - 1 ? true : false
                }
                hidden={post.photoUrls.length === 1}
                className="btn bt-sm rounded-2xl btn-secondary"
              >
                next
              </button>
            </div>
          </figure>
        )}
        <div className="flex justify-start p-4">
                {/* Like Button */}
                <button className="btn btn-neutral rounded-full">
                  <svg
                    className="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      // fill={isLiked ? "red" : "none"}
                      stroke="currentColor"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    </g>
                  </svg>
                </button>
                {/* Comment Button */}
                <button className="btn btn-neutral bg-red rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16" 
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                  >
                    <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                    <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2" />
                  </svg>
                </button>
              </div>
      </div>
    </div>
  );
};

export default PostCard;
