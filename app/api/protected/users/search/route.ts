// app/api/protected/users/search/route.ts
import { findUserByCriteria, getUserProfileById } from "@/services/users";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";
import { AppError } from "@/lib/api/app-error";
import type { UserProfileResponse } from "@/types";

export const GET = withApiHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim() || undefined;
  const mobNo =
    searchParams.get("mobNo")?.trim() ||
    searchParams.get("mobile")?.trim() ||
    undefined;

  if (!email && !mobNo) {
    throw AppError.validation("Please provide either an email or mobile number to search");
  }

  const foundUser = await findUserByCriteria({ email, mobNo });

  if (!foundUser) {
    throw AppError.notFound("User not found");
  }

  const userProfile = await getUserProfileById(foundUser.id);

  if (!userProfile) {
    throw AppError.notFound("User profile not found");
  }

  return sendSuccess<{ user: UserProfileResponse }>({ user: userProfile });
});