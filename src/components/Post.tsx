import type { RouterOutputs } from "~/utils/api";
import Image from "next/image";
import Link from "next/link";
import { type MouseEvent, useRef } from "react";

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const Post = (props: PostWithUser) => {
  const postLinkRef = useRef<HTMLAnchorElement>(null);
  const profileLinkRef = useRef<HTMLAnchorElement>(null);
  const { post, author } = props;
  const handleCardClick = () => {
    if (postLinkRef && postLinkRef.current) {
      postLinkRef.current.click();
    }
  };
  // need to stop propagation on the post and username click after the card click handler clicks them; otherwise the Card gets clicked twice.
  const handlePostClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  const handleUsernameClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };
  return (
    <div
      key={post.id}
      className="flex gap-3 border border-slate-600 p-8 hover:border-2 hover:border-indigo-700"
      onClick={handleCardClick}
    >
      <Image
        src={author.profilePic}
        alt="Profile Picture"
        className="h-14 w-14 rounded-full"
        height={56}
        width={56}
      />
      <div className="flex flex-col">
        <div className="flex text-slate-300 hover:text-slate-500">
          <Link
            href={`/@${author.username}`}
            ref={profileLinkRef}
            onClick={handleUsernameClick}
          >
            <span className="font-thin">{author.username}</span>
          </Link>
        </div>
        <Link
          href={`/post/${post.id}`}
          ref={postLinkRef}
          onClick={handlePostClick}
        >
          <span>{post.content}</span>
        </Link>
      </div>
    </div>
  );
};
