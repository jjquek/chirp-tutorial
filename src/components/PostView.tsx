import type { RouterOutputs } from "~/utils/api";
import Image from "next/image";
import Link from "next/link";

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-8">
      <Image
        src={author.profilePic}
        alt="Profile Picture"
        className="h-14 w-14 rounded-full"
        height={56}
        width={56}
      />
      <div className="flex flex-col">
        <div className="flex text-slate-300">
          <Link href={`/@${author.username}`}>
            <span className="font-thin">{author.username}</span>
          </Link>
        </div>
        <Link href={`/post/${post.id}`}>
          <span>{post.content}</span>
        </Link>
      </div>
    </div>
  );
};
