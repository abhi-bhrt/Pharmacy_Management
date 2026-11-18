// services/shops/shop-create.service.ts
import type { PoolClient } from "pg";
import { pool, withTransaction, isPool, type DbExecutor } from "@/lib/db/client";
import { AppError } from "@/lib/api/app-error";
import type { Address, CreateShopInput, Shop, ShopResponse } from "@/types";

export async function createShopService(
  input: CreateShopInput,
  executor: DbExecutor = pool
): Promise<ShopResponse> {
  if (!input?.ownerId?.trim()) {
    throw AppError.validation("Owner ID is required to create a shop");
  }

  if (isPool(executor)) {
    return withTransaction((client) => executeCreateShop(input, client), executor);
  }
  return executeCreateShop(input, executor);
}

async function executeCreateShop(
  input: CreateShopInput,
  client: PoolClient
): Promise<ShopResponse> {
  const {
    ownerId,
    shopName,
    phone,
    email,
    drugLicenceNumber,
    pharmacistName,
    pharmacistRegistrationNumber,
    gstin,
    location,
    address,
    imageId = null,
  } = input;

  const existingShop = await client.query<{ id: string }>(
    `SELECT id FROM shops WHERE owner_id = $1 LIMIT 1`,
    [ownerId]
  );

  if (existingShop.rows.length > 0) {
    throw AppError.conflict("A user can only create and manage a single shop");
  }

  if (!address?.pincode?.trim() || !address?.state?.trim() || !address?.district?.trim() || !address?.area?.trim()) {
    throw AppError.validation("Complete shop address (pincode, state, district, area) is required");
  }

  const addressRes = await client.query<Address>(
    `INSERT INTO addresses (pincode, state, country, district, area)
     VALUES ($1, $2, COALESCE($3, 'IN'), $4, $5)
     RETURNING id, pincode, state, country, district, area, created_at, updated_at`,
    [
      address.pincode.trim(),
      address.state.trim(),
      address.country?.trim() || "IN",
      address.district.trim(),
      address.area.trim(),
    ]
  );
  const shopAddress = addressRes.rows[0];

  const shopRes = await client.query<Shop>(
    `INSERT INTO shops (
      shop_name, phone, email, drug_licence_number,
      pharmacist_name, pharmacist_registration_number,
      gstin, owner_id, address_id, image_id, location
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      shopName.trim(),
      phone.trim(),
      email.toLowerCase().trim(),
      drugLicenceNumber.trim(),
      pharmacistName.trim(),
      pharmacistRegistrationNumber.trim(),
      gstin.trim(),
      ownerId,
      shopAddress.id,
      imageId || null,
      location?.trim() || null,
    ]
  );

  await client.query(
    `UPDATE users 
     SET role = 'ADMIN', updated_at = NOW() 
     WHERE id = $1 AND role NOT IN ('ADMIN', 'SUPERADMIN')`,
    [ownerId]
  );

  return {
    ...shopRes.rows[0],
    address: shopAddress,
  };
}