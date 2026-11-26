import type { Request, Response } from "express";
import { findUserByCriteria, getUserProfileById, updateUserService } from "@/services/users";
import { AppError } from "@/lib/api/app-error";
import { getAuthenticatedUserId } from "@/lib/auth/auth.middleware";
import { sendSuccess, withApiHandler } from "@/lib/api/api-handler";
import { getJsonBody, getQueryString } from "./request.utils";
import type { UpdateUserInput } from "@/types";

export const getProfile = withApiHandler(async (request: Request, response: Response) => {
  const user = await getUserProfileById(getAuthenticatedUserId(request));
  if (!user) {
    throw AppError.notFound("User profile not found");
  }
  sendSuccess(response, { user });
});

export const updateProfile = withApiHandler(async (request: Request, response: Response) => {
  const body = getJsonBody<UpdateUserInput & { email?: unknown }>(request);
  const safeUpdateData: UpdateUserInput = {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.mobNo !== undefined && { mobNo: body.mobNo }),
    ...(body.password !== undefined && { password: body.password }),
    ...(body.address !== undefined && { address: body.address }),
  };
  const user = await updateUserService(
    getAuthenticatedUserId(request),
    safeUpdateData
  );
  sendSuccess(response, { user }, "User profile updated successfully");
});

export const searchUsers = withApiHandler(async (request: Request, response: Response) => {
  const email = getQueryString(request, "email") || undefined;
  const mobNo =
    getQueryString(request, "mobNo") ||
    getQueryString(request, "mobile") ||
    undefined;
  if (!email && !mobNo) {
    throw AppError.validation("Please provide either an email or mobile number to search");
  }

  const foundUser = await findUserByCriteria({ email, mobNo });
  if (!foundUser) {
    throw AppError.notFound("User not found");
  }
  const user = await getUserProfileById(foundUser.id);
  if (!user) {
    throw AppError.notFound("User profile not found");
  }
  sendSuccess(response, { user });
});
