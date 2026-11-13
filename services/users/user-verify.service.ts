// services/users/user-verify.service.ts
import type { VerifyCredentialsInput, UserProfileResponse, SignInInput } from "@/types/user.types";
import { getUserProfileById } from "./index";
import { pool, type DbExecutor } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/password.util";
import { signToken } from "@/lib/auth/jwt.util";
import { AppError } from "@/lib/api/app-error";

interface VerifyCredentialsResult {
  user: UserProfileResponse;
  token: string;
}

export async function verifyUserCredentials(
  input: SignInInput,
  executor: DbExecutor = pool
): Promise<VerifyCredentialsResult | null> {

  const { email, password } = input;

  if (!email || !password) {
    throw AppError.validation("Email and password are required");
  }

  try {

    const queryText = `
    SELECT id, email, password, role
    FROM users
    WHERE email = $1
    LIMIT 1
  `;

    const result = await executor.query<VerifyCredentialsInput>(queryText, [email.toLowerCase().trim()]);

    const existing = result.rows[0];

    if (!existing) {
      throw AppError.notFound("User not found");
    }

    const isPasswordValid = await verifyPassword(password, existing.password);

    if (!isPasswordValid) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const token = await signToken({
      userId: existing.id,
      email: existing.email,
      role: existing.role,
    });

    const user = await getUserProfileById(existing.id);

    if(!user) {
      throw AppError.notFound("User profile not found");
    }

    return {
      user, token,
    };

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error("Error executing verifyUserCredentials:", error);

    throw AppError.internal("Internal server error during authentication");
  }
}