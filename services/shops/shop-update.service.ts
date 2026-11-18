// services/shops/shop-update.service.ts
import type { PoolClient } from "pg";
import { pool, withTransaction, isPool, type DbExecutor } from "@/lib/db/client";
import { AppError } from "@/lib/api/app-error";
import { getShopByOwnerService } from "./shop-find.service";
import type { Shop, ShopResponse, UpdateShopInput } from "@/types";

export async function updateShopService(
  input: UpdateShopInput,
  executor: DbExecutor = pool
): Promise<ShopResponse> {
  if (!input?.ownerId?.trim()) {
    throw AppError.validation("Owner ID is required for updating shop");
  }

  if (isPool(executor)) {
    return withTransaction((client) => executeUpdateShop(input, client), executor);
  }
  return executeUpdateShop(input, executor);
}

async function executeUpdateShop(
  input: UpdateShopInput,
  client: PoolClient
): Promise<ShopResponse> {
  const { ownerId, address, ...shopUpdates } = input;

  const currentShopRes = await client.query<Shop>(
    `SELECT * FROM shops WHERE owner_id = $1 LIMIT 1`,
    [ownerId]
  );

  if (currentShopRes.rows.length === 0) {
    throw AppError.notFound("Shop not found");
  }

  const currentShop = currentShopRes.rows[0];

  if (address && Object.keys(address).length > 0) {
    await client.query(
      `UPDATE addresses 
       SET pincode = COALESCE(NULLIF($1, ''), pincode),
           state = COALESCE(NULLIF($2, ''), state),
           country = COALESCE(NULLIF($3, ''), country),
           district = COALESCE(NULLIF($4, ''), district),
           area = COALESCE(NULLIF($5, ''), area),
           updated_at = NOW()
       WHERE id = $6`,
      [
        address.pincode?.trim(),
        address.state?.trim(),
        address.country?.trim(),
        address.district?.trim(),
        address.area?.trim(),
        currentShop.address_id,
      ]
    );
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  const mapping: Record<keyof Omit<UpdateShopInput, "ownerId" | "address">, string> = {
    shopName: "shop_name",
    phone: "phone",
    email: "email",
    drugLicenceNumber: "drug_licence_number",
    pharmacistName: "pharmacist_name",
    pharmacistRegistrationNumber: "pharmacist_registration_number",
    gstin: "gstin",
    location: "location",
    imageId: "image_id",
  };

  for (const [key, column] of Object.entries(mapping)) {
    const rawValue = shopUpdates[key as keyof typeof mapping];
    if (rawValue !== undefined) {
      fields.push(`${column} = $${index++}`);
      if (typeof rawValue === "string") {
        values.push(key === "email" ? rawValue.toLowerCase().trim() : rawValue.trim());
      } else {
        values.push(rawValue);
      }
    }
  }

  if (fields.length > 0) {
    fields.push(`updated_at = NOW()`);
    values.push(currentShop.id);

    await client.query(
      `UPDATE shops
       SET ${fields.join(", ")}
       WHERE id = $${index}`,
      values
    );
  }

  const updatedShop = await getShopByOwnerService(ownerId, client);
  if (!updatedShop) {
    throw AppError.notFound("Updated shop profile not found");
  }

  return updatedShop;
}