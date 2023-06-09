// NOTE : [slug] makes it such that this page is loaded on any route that is not captured by the other routes specified in the 'pages' parent directory. We're intending for this file to specify the Profile view.
import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/PageLayout";
import Image from "next/image";
import LoadSpinner from "~/components/LoadSpinner";
import { Post } from "~/components/Post";

const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({
    userId: props.userId,
  });
  if (isLoading) return <LoadSpinner />;
  if (!data || data.length === 0) return <div>User has not posted.</div>;
  return (
    <div className="flex flex-col">
      {data.map((postAndAuthor) => (
        <Post {...postAndAuthor} key={postAndAuthor.post.id} />
      ))}
    </div>
  );
};

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getUserByUsername.useQuery({
    // no loading state because the page is fully rendered once delivered by the server. (See notes and comments on `getStaticProps` below)
    username: username,
  });
  if (!data) return <div>Something went wrong...</div>;
  return (
    <>
      <Head>
        <title>{data.username ?? data.externalUsername ?? ""}</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <div className="relative h-36 bg-slate-700">
          <Image
            src={data.profilePic}
            alt={`${
              data.username ?? data.externalUsername ?? ""
            }'s profile picture`}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-16 ml-4 rounded-full border-4 border-black"
          />
        </div>
        {/* add a div which acts as spacer to push username below the absolutely positioned Profile Picture */}
        <div className="h-12"></div>
        <div className="p-8 text-2xl font-bold">{`@${
          data.username ?? data.externalUsername ?? ""
        }`}</div>
        <div className="w-full border-b border-slate-500"></div>
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};

import { generateSSGHelper } from "~/server/helpers/generateSSGHelper";
// note: not sure why it wasn't immediately being ported in via VSCode Intellisense.
export const getStaticProps: GetStaticProps = async (context) => {
  // We use getStaticProps because this is a page that (1) needs to fetch data, (2) won't change that frequently. The page is pre-rendered by next at build time such that when the user requests for the page, the page can be served fully rendered. There doesn't need to be more data fetching.
  const ssg = generateSSGHelper();
  const slug = context.params?.slug;
  // TODO : refactor this-- should instead redirect to another page.
  if (typeof slug !== "string") throw new Error("no slug");
  const username = slug.replace("@", "");
  await ssg.profile.getUserByUsername.prefetch({ username });
  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

// note : required for use with getStaticProps
export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
