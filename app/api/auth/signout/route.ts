// app/api/auth/signout/route.ts
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";
import { removeAuthCookieFromResponse } from "@/lib/auth/cookies.util";

export const POST = withApiHandler(async () => {
  const response = sendSuccess(null, "Signed out successfully");
  return removeAuthCookieFromResponse(response);
});