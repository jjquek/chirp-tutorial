import type { User } from "@clerk/nextjs/dist/api";

export const filterUserForClient = (user: User) => {
  // filtering the User object that gets returned by clerkClient
  return {
    id: user.id,
    username: user.username,
    profilePic: user.profileImageUrl,
    // TODO : figure out why Daniel has neither a username nor externalAccount.username having signed up via Google.
    externalUsername: user.externalAccounts[0]?.username ?? "username-less",
  };
};
