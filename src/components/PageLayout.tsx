import { type PropsWithChildren } from "react";

export const PageLayout = (props: PropsWithChildren) => {
  // NOTE : attempted to put back button here for Post and Profile views with useRouter from next/js, but that won't achieve the desired functionality-- should instead put a 'Home' button
  return (
    <main className="flex h-screen justify-center">
      <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
        {props.children}
      </div>
    </main>
  );
};
