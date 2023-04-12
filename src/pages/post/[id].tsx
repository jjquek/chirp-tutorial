import { type NextPage } from "next";
import Head from "next/head";

const SinglePostPage: NextPage = () => {
  // start fetching once home page loads; React Query lets you just use a cached fetch if it's already completed.
  // sanity checks for ensuring that data is loaded.
  return (
    <>
      <Head>
        <title>Post</title>
        <meta name="description" content="page-with-single-post-content" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">SinglePost</main>
    </>
  );
};

export default SinglePostPage;
