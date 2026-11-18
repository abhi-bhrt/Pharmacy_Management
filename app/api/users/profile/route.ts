// app/api/users/profile/route.ts
import { getUserProfileById, updateUserService } from "@/services/users";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";
import { AppError } from "@/lib/api/app-error";
import type { UpdateUserInput, UserProfileResponse } from "@/types";

function getAuthenticatedUserId(req: Request): string {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw AppError.unauthorized("Authentication context missing");
  }
  return userId;
}

export const GET = withApiHandler(async (req: Request) => {
  const userId = getAuthenticatedUserId(req);
  const userProfile = await getUserProfileById(userId);

  if (!userProfile) {
    throw AppError.notFound("User profile not found");
  }

  return sendSuccess<{ user: UserProfileResponse }>({ user: userProfile });
});

const handleUpdate = withApiHandler(async (req: Request) => {
  const userId = getAuthenticatedUserId(req);
  const body = await req.json().catch(() => ({}));

  const {
    email: _disallowedEmail,
    role: _disallowedRole,
    status: _disallowedStatus,
    isProfileComplete: _disallowedComplete,
    ...safeUpdateData
  }: UpdateUserInput & { email?: string } = body;

  const updatedProfile = await updateUserService(userId, safeUpdateData);

  return sendSuccess<{ user: UserProfileResponse }>(
    { user: updatedProfile },
    "User profile updated successfully"
  );
});

export const PUT = handleUpdate;
export const PATCH = handleUpdate;