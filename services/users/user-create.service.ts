import { AppError } from "@/lib/api/app-error";
import { hashPassword } from "@/lib/auth/password.util";
import { signToken } from "@/lib/auth/jwt.util";
import { prisma, withTransaction, type DbExecutor } from "@/lib/db/client";
import { findUserByCriteria } from "./user-find.service";
import { getUserProfileById } from "./user-profile.service";
import type { AuthResponse, CreateUserInput } from "@/types";

export async function createUserService(
  input: CreateUserInput,
  executor: DbExecutor = prisma
): Promise<AuthResponse> {
  return withTransaction((tx) => executeCreateUser(input, tx), executor);
}

async function executeCreateUser(
  input: CreateUserInput,
  executor: DbExecutor
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
      executor
    );

    if (existing) {
      throw AppError.conflict("User with this email or mobile number already exists");
    }

    const hasCompleteAddress = Boolean(
      address?.pincode?.trim() &&
        address?.state?.trim() &&
        address?.district?.trim() &&
        address?.area?.trim()
    );

    const savedAddress = hasCompleteAddress
      ? await executor.address.create({
          data: {
            pincode: address!.pincode.trim(),
            state: address!.state.trim(),
            country: address!.country?.trim() || "IN",
            district: address!.district!.trim(),
            area: address!.area!.trim(),
          },
          select: { id: true },
        })
      : null;

    const isProfileComplete = Boolean(trimmedName && normalizedEmail && trimmedMobNo && savedAddress);
    const hashedPassword = await hashPassword(password);

    const createdUser = await executor.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        mob_no: trimmedMobNo,
        password: hashedPassword,
        role,
        status: "ACTIVE",
        is_profile_complete: isProfileComplete,
        address_id: savedAddress?.id ?? null,
      },
      select: { id: true, email: true, role: true },
    });

    const userProfile = await getUserProfileById(createdUser.id, executor);
    if (!userProfile) {
      throw AppError.internal("Failed to retrieve created user profile");
    }

    const token = await signToken({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role as typeof role,
    });

    return { user: userProfile, token };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw AppError.conflict("User with this email or mobile number already exists");
    }

    console.error("Error executing createUserService:", error);
    throw AppError.internal("Internal server error while creating user");
  }
}
