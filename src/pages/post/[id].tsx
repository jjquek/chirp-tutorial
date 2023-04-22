import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { Post } from "~/components/Post";
import { PageLayout } from "~/components/PageLayout";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  const { data } = api.posts.getById.useQuery({
    // no loading state because the page is fully rendered once delivered by the server. (See notes and comments on `getStaticProps` below)
    userId: id,
  });
  if (!data) return <div>Something went wrong...</div>;
  return (
    <>
      <Head>
        <title>{`${data.post.content} - ${data.author.username}`}</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <Post {...data} />
      </PageLayout>
    </>
  );
};

import { generateSSGHelper } from "~/server/helpers/generateSSGHelper";
// note: not sure why it wasn't immediately being ported in via VSCode Intellisense.
export const getStaticProps: GetStaticProps = async (context) => {
  // We use getStaticProps because this is a page that (1) needs to fetch data, (2) won't change that frequently. The page is pre-rendered by next at build time such that when the user requests for the page, the page can be served fully rendered. There doesn't need to be more data fetching.
  const ssg = generateSSGHelper();
  const id = context.params?.id;
  // TODO : refactor this-- should instead redirect to another page.
  if (typeof id !== "string") throw new Error("no slug");
  await ssg.posts.getById.prefetch({ userId: id });
  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

// note : required for use with getStaticProps
export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
