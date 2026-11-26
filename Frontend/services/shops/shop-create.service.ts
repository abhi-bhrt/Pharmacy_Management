import { AppError } from "@/lib/api/app-error";
import { prisma, withTransaction, type DbExecutor } from "@/lib/db/client";
import { toAddress, toShop } from "@/lib/db/mappers";
import type { CreateShopInput, ShopResponse } from "@/types";

export async function createShopService(
  input: CreateShopInput,
  executor: DbExecutor = prisma
): Promise<ShopResponse> {
  if (!input?.ownerId?.trim()) {
    throw AppError.validation("Owner ID is required to create a shop");
  }

  return withTransaction((tx) => executeCreateShop(input, tx), executor);
}

async function executeCreateShop(
  input: CreateShopInput,
  executor: DbExecutor
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

  const existingShop = await executor.shop.findFirst({
    where: { owner_id: ownerId },
    select: { id: true },
  });

  if (existingShop) {
    throw AppError.conflict("A user can only create and manage a single shop");
  }

  if (
    !address?.pincode?.trim() ||
    !address?.state?.trim() ||
    !address?.district?.trim() ||
    !address?.area?.trim()
  ) {
    throw AppError.validation("Complete shop address (pincode, state, district, area) is required");
  }

  const shopAddress = await executor.address.create({
    data: {
      pincode: address.pincode.trim(),
      state: address.state.trim(),
      country: address.country?.trim() || "IN",
      district: address.district.trim(),
      area: address.area.trim(),
    },
  });

  const shop = await executor.shop.create({
    data: {
      shop_name: shopName.trim(),
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      drug_licence_number: drugLicenceNumber.trim(),
      pharmacist_name: pharmacistName.trim(),
      pharmacist_registration_number: pharmacistRegistrationNumber.trim(),
      gstin: gstin.trim(),
      owner_id: ownerId,
      address_id: shopAddress.id,
      image_id: imageId || null,
      location: location?.trim() || null,
    },
  });

  await executor.user.updateMany({
    where: { id: ownerId, role: { notIn: ["ADMIN", "SUPERADMIN"] } },
    data: { role: "ADMIN" },
  });

  return toShop(shop, toAddress(shopAddress));
}
