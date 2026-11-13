// app/api/auth/signin/route.ts
import { verifyUserCredentials } from "@/services/users/user-verify.service";
import { setAuthCookieOnResponse } from "@/lib/auth/cookies.util";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";

export const POST = withApiHandler(async (req: Request) => {

  const body = await req.json().catch(() => ({}));

  const { email, password } = body;

  const verifyResult = await verifyUserCredentials({ email, password });

  if (!verifyResult) {
    throw new Error("failed to verify user credentials");
  }

  const response = sendSuccess({ user: verifyResult.user }, "user signed in successfully");

  return setAuthCookieOnResponse(response, verifyResult.token);
});