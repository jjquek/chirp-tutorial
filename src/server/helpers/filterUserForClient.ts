import type { User } from "@clerk/nextjs/dist/api";

export const filterUserForClient = (user: User) => {
  // filtering the User object that gets returned by clerkClient
  return {
    id: user.id,
    username: user.username,
    profilePic: user.profileImageUrl,
  };
};
