// app/api/auth/signup/route.ts
import { createUserService } from "@/services/users";
import { setAuthCookieOnResponse } from "@/lib/auth/cookies.util";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";

export const POST = withApiHandler(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const { name, email, mobNo, password, address } = body;

  const { user, token } = await createUserService({
    name,
    email,
    mobNo,
    password,
    address,
  });

  const response = sendSuccess(
    { user },
    "Registration successful",
    201
  );

  return setAuthCookieOnResponse(response, token);
});