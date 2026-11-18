// services/users/user-create.service.ts
import type { PoolClient } from "pg";
import { pool, withTransaction, isPool, type DbExecutor } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password.util";
import { signToken } from "@/lib/auth/jwt.util";
import { AppError } from "@/lib/api/app-error";
import { findUserByCriteria } from "./user-find.service";
import { getUserProfileById } from "./user-profile.service";
import type { CreateUserInput, AuthResponse } from "@/types";

export async function createUserService(
  input: CreateUserInput,
  executor: DbExecutor = pool
): Promise<AuthResponse> {
  if (isPool(executor)) {
    return withTransaction((client) => executeCreateUser(input, client), executor);
  }
  return executeCreateUser(input, executor);
}

async function executeCreateUser(
  input: CreateUserInput,
  client: PoolClient
): Promise<AuthResponse> {
  const { name, email, mobNo, password, role = "CUSTOMER", address } = input;

  const trimmedName = name?.trim();
  const normalizedEmail = email?.toLowerCase().trim();
  const trimmedMobNo = mobNo?.trim();

  if (!trimmedName || !normalizedEmail || !trimmedMobNo || !password) {
    throw AppError.validation("Name, email, mobile number, and password are required");
  }

  try {
    const existing = await findUserByCriteria(
      { email: normalizedEmail, mobNo: trimmedMobNo },
      client
    );

    if (existing) {
      throw AppError.conflict("User with this email or mobile number already exists");
    }

    let addressId: string | null = null;

    const hasCompleteAddress = Boolean(
      address?.pincode?.trim() &&
      address?.state?.trim() &&
      address?.district?.trim() &&
      address?.area?.trim()
    );

    if (address?.pincode?.trim() && address?.state?.trim()) {
      const addressRes = await client.query<{ id: string }>(
        `INSERT INTO addresses (pincode, state, country, district, area)
         VALUES ($1, $2, COALESCE($3, 'IN'), $4, $5)
         RETURNING id`,
        [
          address.pincode.trim(),
          address.state.trim(),
          address.country?.trim() || "IN",
          address.district?.trim() ?? null,
          address.area?.trim() ?? null,
        ]
      );
      addressId = addressRes.rows[0].id;
    }

    const isProfileComplete = Boolean(
      trimmedName &&
      normalizedEmail &&
      trimmedMobNo &&
      addressId &&
      hasCompleteAddress
    );

    const hashedPassword = await hashPassword(password);

    const userRes = await client.query<{ id: string; email: string; role: typeof role }>(
      `INSERT INTO users (name, email, mob_no, password, role, status, is_profile_complete, address_id)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, $7)
       RETURNING id, email, role`,
      [trimmedName, normalizedEmail, trimmedMobNo, hashedPassword, role, isProfileComplete, addressId]
    );

    const createdUser = userRes.rows[0];

    const userProfile = await getUserProfileById(createdUser.id, client);

    if (!userProfile) {
      throw AppError.internal("Failed to retrieve created user profile");
    }

    const token = await signToken({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    });

    return { user: userProfile, token };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw AppError.conflict("User with this email or mobile number already exists");
    }

    console.error("Error executing createUserService:", error);

    throw AppError.internal("Internal server error while creating user");
  }
}