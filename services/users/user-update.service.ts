// services/users/user-update.service.ts
import type { PoolClient } from "pg";
import { pool, withTransaction, isPool, type DbExecutor } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password.util";
import { AppError } from "@/lib/api/app-error";
import { findUserByCriteria } from "./user-find.service";
import { getUserProfileById } from "./user-profile.service";
import type { UpdateUserInput, UserProfileResponse } from "@/types";

export async function updateUserService(
  userId: string,
  input: UpdateUserInput,
  executor: DbExecutor = pool
): Promise<UserProfileResponse> {
  if (!userId?.trim()) {
    throw AppError.validation("User ID is required");
  }

  if (isPool(executor)) {
    return withTransaction((client) => executeUpdateUser(userId.trim(), input, client), executor);
  }
  return executeUpdateUser(userId.trim(), input, executor);
}

async function executeUpdateUser(
  userId: string,
  input: UpdateUserInput,
  client: PoolClient
): Promise<UserProfileResponse> {
  const { name, mobNo, password, role, status, isProfileComplete, address } = input;

  try {
    const userCheckRes = await client.query<{
      id: string;
      name: string;
      mob_no: string;
      address_id: string | null;
    }>(
      `SELECT id, name, mob_no, address_id FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (userCheckRes.rows.length === 0) {
      throw AppError.notFound("User not found");
    }

    const existingUser = userCheckRes.rows[0];
    let addressId = existingUser.address_id;

    const trimmedMobNo = mobNo?.trim();
    if (trimmedMobNo) {
      const existingMobileUser = await findUserByCriteria({ mobNo: trimmedMobNo }, client);
      if (existingMobileUser && existingMobileUser.id !== userId) {
        throw AppError.conflict("Mobile number is already in use by another account");
      }
    }

    if (address) {
      const cleanPincode = address.pincode?.trim() || null;
      const cleanState = address.state?.trim() || null;
      const cleanCountry = address.country?.trim() || null;
      const cleanDistrict = address.district?.trim() || null;
      const cleanArea = address.area?.trim() || null;

      if (addressId) {
        await client.query(
          `UPDATE addresses
           SET pincode = COALESCE($1, pincode),
               state = COALESCE($2, state),
               country = COALESCE($3, country),
               district = COALESCE($4, district),
               area = COALESCE($5, area),
               updated_at = NOW()
           WHERE id = $6`,
          [cleanPincode, cleanState, cleanCountry, cleanDistrict, cleanArea, addressId]
        );
      } else if (cleanPincode && cleanState) {
        const addressRes = await client.query<{ id: string }>(
          `INSERT INTO addresses (pincode, state, country, district, area)
           VALUES ($1, $2, COALESCE($3, 'IN'), $4, $5)
           RETURNING id`,
          [cleanPincode, cleanState, cleanCountry ?? "IN", cleanDistrict, cleanArea]
        );
        addressId = addressRes.rows[0].id;
      }
    }

    let computedProfileComplete = isProfileComplete;
    if (computedProfileComplete === undefined) {
      const finalName = name !== undefined ? name.trim() : existingUser.name;
      const finalMob = trimmedMobNo !== undefined ? trimmedMobNo : existingUser.mob_no;

      let hasCompleteAddress = false;
      if (addressId) {
        const addrCheck = await client.query<{
          pincode: string | null;
          state: string | null;
          district: string | null;
          area: string | null;
        }>(
          `SELECT pincode, state, district, area FROM addresses WHERE id = $1 LIMIT 1`,
          [addressId]
        );
        const addr = addrCheck.rows[0];
        hasCompleteAddress = Boolean(
          addr?.pincode?.trim() &&
          addr?.state?.trim() &&
          addr?.district?.trim() &&
          addr?.area?.trim()
        );
      }

      computedProfileComplete = Boolean(finalName && finalMob && hasCompleteAddress);
    }

    const updateFields: string[] = [];
    const queryParams: unknown[] = [];
    let paramIdx = 1;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw AppError.validation("Name cannot be empty");
      }
      updateFields.push(`name = $${paramIdx++}`);
      queryParams.push(trimmedName);
    }

    if (trimmedMobNo !== undefined) {
      if (!trimmedMobNo) {
        throw AppError.validation("Mobile number cannot be empty");
      }
      updateFields.push(`mob_no = $${paramIdx++}`);
      queryParams.push(trimmedMobNo);
    }

    if (password !== undefined) {
      if (!password) {
        throw AppError.validation("Password cannot be empty");
      }
      const hashedPassword = await hashPassword(password);
      updateFields.push(`password = $${paramIdx++}`);
      queryParams.push(hashedPassword);
    }

    if (role !== undefined) {
      updateFields.push(`role = $${paramIdx++}`);
      queryParams.push(role);
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIdx++}`);
      queryParams.push(status);
    }

    if (computedProfileComplete !== undefined) {
      updateFields.push(`is_profile_complete = $${paramIdx++}`);
      queryParams.push(computedProfileComplete);
    }

    if (addressId !== existingUser.address_id) {
      updateFields.push(`address_id = $${paramIdx++}`);
      queryParams.push(addressId);
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      queryParams.push(userId);

      await client.query(
        `UPDATE users
         SET ${updateFields.join(", ")}
         WHERE id = $${paramIdx}`,
        queryParams
      );
    }

    const updatedProfile = await getUserProfileById(userId, client);
    if (!updatedProfile) {
      throw AppError.notFound("User profile not found");
    }

    return updatedProfile;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "23505") {
        throw AppError.conflict("Mobile number is already in use by another account");
      }
      if (error.code === "22P02") {
        throw AppError.validation("Invalid User ID format");
      }
    }

    console.error("Error executing updateUserService:", error);
    throw AppError.internal("Internal server error while updating user profile");
  }
}