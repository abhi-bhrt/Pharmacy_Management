import { AppError } from "@/lib/api/app-error";
import { prisma, type DbExecutor } from "@/lib/db/client";
import { toUser } from "@/lib/db/mappers";
import type { FindUserCriteria, User } from "@/types";

export async function findUserByCriteria(
  criteria: FindUserCriteria,
  executor: DbExecutor = prisma
): Promise<User | null> {
  const OR = [
    ...(criteria.id ? [{ id: criteria.id.trim() }] : []),
    ...(criteria.email ? [{ email: criteria.email.toLowerCase().trim() }] : []),
    ...(criteria.mobNo ? [{ mob_no: criteria.mobNo.trim() }] : []),
  ];

  if (OR.length === 0) {
    return null;
  }

  try {
    const user = await executor.user.findFirst({ where: { OR } });
    return user ? toUser(user) : null;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2023") {
      throw AppError.validation("Invalid ID format in search criteria");
    }

    console.error("Error executing findUserByCriteria query:", error);
    throw AppError.internal("Internal server error while searching for user");
  }
}
