import { type NextPage } from "next";
import { SignInButton, useUser } from "@clerk/nextjs";
import { api } from "~/utils/api";
import Image from "next/image";
import LoadSpinner, { LoadingPage } from "~/components/LoadSpinner";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { PageLayout } from "~/components/PageLayout";
import { Post } from "~/components/Post";

const CreatePostWizard = () => {
  const { user } = useUser();
  // TODO : refactor this (i.e., useState hook) to use react-hook-form to validate form control input. This vanilla way of handling the keypresses can lead to 'sticky keys' where keypresses are not fluently registered in the UI state. Nonetheless, this is the most straightforward way to get things 'up and running'.
  const [input, setInput] = useState("");
  // `ctx` here is used to gain access to the tRPC cache on the client-side to specify what should happen when a successful mutation (i.e., post) occurs. We are 'refreshing' the feed.
  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      // without `void`, TS complains that the promise returned by invalidate isn't being handled. However, we don't need the Promise object returned, so we ask TS to explicitly ignore it with `void` as recommended.
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post; only emojis allowed. Please try again.");
      }
    },
  });
  if (!user) return null;
  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.profileImageUrl}
        alt="Profile Image"
        className="h-14 w-14 rounded-full"
        height={56} // required for clerk to not throw error with Next Image.
        width={56}
      />
      <input
        type="text"
        placeholder="Type some emojis!"
        className="flex-grow bg-transparent outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        // enable 'Enter' submit
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
        disabled={isPosting}
      />
      {input !== "" && !isPosting && (
        <button
          onClick={(e) => {
            e.preventDefault();
            mutate({ content: input });
          }}
          disabled={isPosting}
        >
          Post
        </button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadSpinner />
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();
  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;
  return (
    <div className="flex flex-col">
      {data?.map((postAndAuthor) => (
        <Post {...postAndAuthor} key={postAndAuthor.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  // TODO : figure out why back button doesn't work-- can't go back from Post or Profile views.
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  // start fetching once home page loads; React Query lets you just use a cached fetch if it's already completed.
  api.posts.getAll.useQuery();
  // sanity checks for ensuring that data is loaded.
  if (!userLoaded) return <div />;
  return (
    <>
      <PageLayout>
        <div
          className="flex border-b border-slate-400 p-8
          "
        >
          {!isSignedIn && (
            <div className="flex justify-center">
              <SignInButton />
            </div>
          )}
          {isSignedIn && <CreatePostWizard />}
        </div>
        <Feed />
      </PageLayout>
    </>
  );
};

export default Home;
