import { AppError } from "@/lib/api/app-error";
import { prisma, withTransaction, type DbExecutor } from "@/lib/db/client";
import { getShopByOwnerService } from "./shop-find.service";
import type { ShopResponse, UpdateShopInput } from "@/types";

export async function updateShopService(
  input: UpdateShopInput,
  executor: DbExecutor = prisma
): Promise<ShopResponse> {
  if (!input?.ownerId?.trim()) {
    throw AppError.validation("Owner ID is required for updating shop");
  }

  return withTransaction((tx) => executeUpdateShop(input, tx), executor);
}

async function executeUpdateShop(
  input: UpdateShopInput,
  executor: DbExecutor
): Promise<ShopResponse> {
  const { ownerId, address, ...shopUpdates } = input;
  const currentShop = await executor.shop.findFirst({ where: { owner_id: ownerId } });

  if (!currentShop) {
    throw AppError.notFound("Shop not found");
  }

  if (address && Object.keys(address).length > 0) {
    const addressData = {
      ...(address.pincode?.trim() && { pincode: address.pincode.trim() }),
      ...(address.state?.trim() && { state: address.state.trim() }),
      ...(address.country?.trim() && { country: address.country.trim() }),
      ...(address.district?.trim() && { district: address.district.trim() }),
      ...(address.area?.trim() && { area: address.area.trim() }),
    };

    if (Object.keys(addressData).length > 0) {
      await executor.address.update({
        where: { id: currentShop.address_id },
        data: addressData,
      });
    }
  }

  const data = {
    ...(shopUpdates.shopName !== undefined && { shop_name: shopUpdates.shopName.trim() }),
    ...(shopUpdates.phone !== undefined && { phone: shopUpdates.phone.trim() }),
    ...(shopUpdates.email !== undefined && { email: shopUpdates.email.toLowerCase().trim() }),
    ...(shopUpdates.drugLicenceNumber !== undefined && {
      drug_licence_number: shopUpdates.drugLicenceNumber.trim(),
    }),
    ...(shopUpdates.pharmacistName !== undefined && {
      pharmacist_name: shopUpdates.pharmacistName.trim(),
    }),
    ...(shopUpdates.pharmacistRegistrationNumber !== undefined && {
      pharmacist_registration_number: shopUpdates.pharmacistRegistrationNumber.trim(),
    }),
    ...(shopUpdates.gstin !== undefined && { gstin: shopUpdates.gstin.trim() }),
    ...(shopUpdates.location !== undefined && {
      location: shopUpdates.location?.trim() || null,
    }),
    ...(shopUpdates.imageId !== undefined && { image_id: shopUpdates.imageId }),
  };

  if (Object.keys(data).length > 0) {
    await executor.shop.update({ where: { id: currentShop.id }, data });
  }

  const updatedShop = await getShopByOwnerService(ownerId, executor);
  if (!updatedShop) {
    throw AppError.notFound("Updated shop profile not found");
  }

  return updatedShop;
}
