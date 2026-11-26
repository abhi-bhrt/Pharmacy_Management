import type { Request, Response } from "express";
import { createUserService } from "@/services/users";
import { verifyUserCredentials } from "@/services/users/user-verify.service";
import { removeAuthCookie, setAuthCookie } from "@/lib/auth/cookies.util";
import { sendSuccess, withApiHandler } from "@/lib/api/api-handler";
import type { CreateUserInput, SignInInput } from "@/types";
import { getJsonBody } from "./request.utils";

export const signup = withApiHandler(async (request: Request, response: Response) => {
  const { name, email, mobNo, password, address } = getJsonBody<CreateUserInput>(request);
  const { user, token } = await createUserService({
    name,
    email,
    mobNo,
    password,
    address,
  });
  setAuthCookie(response, token);
  sendSuccess(response, { user }, "Registration successful", 201);
});

export const signin = withApiHandler(async (request: Request, response: Response) => {
  const credentials = getJsonBody<SignInInput>(request);
  const result = await verifyUserCredentials(credentials);
  setAuthCookie(response, result.token);
  sendSuccess(response, { user: result.user }, "User signed in successfully");
});

export const signout = withApiHandler(async (_request: Request, response: Response) => {
  removeAuthCookie(response);
  sendSuccess(response, null, "Signed out successfully");
});
