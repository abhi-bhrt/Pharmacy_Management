import { AppError } from "@/lib/api/app-error";
import { prisma, type DbExecutor } from "@/lib/db/client";
import { toAddress, toUser } from "@/lib/db/mappers";
import type { UserProfileResponse } from "@/types";

export async function getUserProfileById(
  userId: string,
  executor: DbExecutor = prisma
): Promise<UserProfileResponse | null> {
  if (!userId) {
    throw AppError.validation("User ID is required");
  }

  try {
    const user = await executor.user.findUnique({
      where: { id: userId },
      include: { address: true },
    });

    if (!user) {
      return null;
    }

    const profile = toUser(user);
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      mob_no: profile.mob_no,
      role: profile.role,
      status: profile.status,
      is_profile_complete: profile.is_profile_complete,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      address: user.address ? toAddress(user.address) : null,
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2023") {
      throw AppError.validation("Invalid User ID format");
    }

    console.error("Error executing getUserProfileById:", error);
    throw AppError.internal("Internal server error while fetching user profile");
  }
}
