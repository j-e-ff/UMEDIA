import React, { useState } from "react";

interface Post {
  comments: string;
  createdAt: any;
  forumId: string;
  photoUrls: string[];
  postId: string;
  title: string;
  updatedAt: any;
  userId: string;
  userName: string;
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
      <div className="h-full bg-neutral text-neutral-content shadow-xl overflow-hidden rounded-xl">
        <div className="card-body h-24 overflow-y-auto">
          <h2 className="card-title">
            @{post.userName}: {post.title}
          </h2>
        </div>
        {post.photoUrls.length > 0 && (
          <figure className="px-6 pb-4 flex flex-col items-center ">
            <div className=" h-130 flex items-center justify-center">
              {/* Image with smooth transition */}
              <img
                key={currentImageIndex} // re-trigger transition on index change
                src={post.photoUrls[currentImageIndex]}
                alt={`Image ${currentImageIndex + 1}`}
                className="w-180 h-full object-contain rounded-lg "
              />
            </div>
            <div className="flex justify-center mt-4 gap-8">
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
      </div>
    </div>
  );
};

export default PostCard;
