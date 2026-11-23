import { AppError } from "@/lib/api/app-error";
import { hashPassword } from "@/lib/auth/password.util";
import { prisma, withTransaction, type DbExecutor } from "@/lib/db/client";
import { findUserByCriteria } from "./user-find.service";
import { getUserProfileById } from "./user-profile.service";
import type { UpdateUserInput, UserProfileResponse } from "@/types";

export async function updateUserService(
  userId: string,
  input: UpdateUserInput,
  executor: DbExecutor = prisma
): Promise<UserProfileResponse> {
  if (!userId?.trim()) {
    throw AppError.validation("User ID is required");
  }

  return withTransaction((tx) => executeUpdateUser(userId.trim(), input, tx), executor);
}

async function executeUpdateUser(
  userId: string,
  input: UpdateUserInput,
  executor: DbExecutor
): Promise<UserProfileResponse> {
  const { name, mobNo, password, role, status, isProfileComplete, address } = input;

  try {
    const existingUser = await executor.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, mob_no: true, address_id: true },
    });

    if (!existingUser) {
      throw AppError.notFound("User not found");
    }

    let addressId = existingUser.address_id;
    const trimmedMobNo = mobNo?.trim();

    if (trimmedMobNo) {
      const existingMobileUser = await findUserByCriteria({ mobNo: trimmedMobNo }, executor);
      if (existingMobileUser && existingMobileUser.id !== userId) {
        throw AppError.conflict("Mobile number is already in use by another account");
      }
    }

    if (address) {
      const addressData = {
        ...(address.pincode?.trim() && { pincode: address.pincode.trim() }),
        ...(address.state?.trim() && { state: address.state.trim() }),
        ...(address.country?.trim() && { country: address.country.trim() }),
        ...(address.district?.trim() && { district: address.district.trim() }),
        ...(address.area?.trim() && { area: address.area.trim() }),
      };

      if (addressId) {
        if (Object.keys(addressData).length > 0) {
          await executor.address.update({ where: { id: addressId }, data: addressData });
        }
      } else if (
        addressData.pincode &&
        addressData.state &&
        addressData.district &&
        addressData.area
      ) {
        const newAddress = await executor.address.create({
          data: {
            pincode: addressData.pincode,
            state: addressData.state,
            country: addressData.country || "IN",
            district: addressData.district,
            area: addressData.area,
          },
          select: { id: true },
        });
        addressId = newAddress.id;
      }
    }

    let computedProfileComplete = isProfileComplete;
    if (computedProfileComplete === undefined) {
      const finalName = name !== undefined ? name.trim() : existingUser.name;
      const finalMobNo = trimmedMobNo !== undefined ? trimmedMobNo : existingUser.mob_no;
      const addressRow = addressId
        ? await executor.address.findUnique({
            where: { id: addressId },
            select: { pincode: true, state: true, district: true, area: true },
          })
        : null;
      const hasCompleteAddress = Boolean(
        addressRow?.pincode.trim() &&
          addressRow.state.trim() &&
          addressRow.district.trim() &&
          addressRow.area.trim()
      );

      computedProfileComplete = Boolean(finalName && finalMobNo && hasCompleteAddress);
    }

    const data: {
      name?: string;
      mob_no?: string;
      password?: string;
      role?: string;
      status?: string;
      is_profile_complete?: boolean;
      address_id?: string | null;
    } = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) throw AppError.validation("Name cannot be empty");
      data.name = trimmedName;
    }

    if (trimmedMobNo !== undefined) {
      if (!trimmedMobNo) throw AppError.validation("Mobile number cannot be empty");
      data.mob_no = trimmedMobNo;
    }

    if (password !== undefined) {
      if (!password) throw AppError.validation("Password cannot be empty");
      data.password = await hashPassword(password);
    }

    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;
    if (computedProfileComplete !== undefined) {
      data.is_profile_complete = computedProfileComplete;
    }
    if (addressId !== existingUser.address_id) data.address_id = addressId;

    if (Object.keys(data).length > 0) {
      await executor.user.update({ where: { id: userId }, data });
    }

    const updatedProfile = await getUserProfileById(userId, executor);
    if (!updatedProfile) {
      throw AppError.notFound("User profile not found");
    }

    return updatedProfile;
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2002") {
        throw AppError.conflict("Mobile number is already in use by another account");
      }
      if (error.code === "P2023") {
        throw AppError.validation("Invalid User ID format");
      }
    }

    console.error("Error executing updateUserService:", error);
    throw AppError.internal("Internal server error while updating user profile");
  }
}
