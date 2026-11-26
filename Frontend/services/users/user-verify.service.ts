import { AppError } from "@/lib/api/app-error";
import { verifyPassword } from "@/lib/auth/password.util";
import { signToken } from "@/lib/auth/jwt.util";
import { prisma, type DbExecutor } from "@/lib/db/client";
import { getUserProfileById } from "./user-profile.service";
import type { AuthResponse, SignInInput, VerifyCredentialsRow } from "@/types";

export async function verifyUserCredentials(
  input: SignInInput,
  executor: DbExecutor = prisma
): Promise<AuthResponse> {
  const { email, password } = input;

  if (!email || !password) {
    throw AppError.validation("Email and password are required");
  }

  try {
    const existing = await executor.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, password: true, role: true },
    });

    if (!existing) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const isPasswordValid = await verifyPassword(password, existing.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const token = await signToken({
      userId: existing.id,
      email: existing.email,
      role: existing.role as VerifyCredentialsRow["role"],
    });

    const user = await getUserProfileById(existing.id, executor);
    if (!user) {
      throw AppError.notFound("User profile not found");
    }

    return { user, token };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error executing verifyUserCredentials:", error);
    throw AppError.internal("Internal server error during authentication");
  }
}
