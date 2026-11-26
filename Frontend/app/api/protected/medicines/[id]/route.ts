// app/api/protected/medicines/[id]/route.ts
import {
  getShopIdByOwner,
  getMedicineByIdService,
  updateMedicineService,
  deleteMedicineService,
} from "@/services/medicines";
import { withApiHandler, sendSuccess } from "@/lib/api/api-handler";
import { AppError } from "@/lib/api/app-error";
import type { Medicine } from "@/types";

function getAuthenticatedUserId(req: Request): string {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw AppError.unauthorized("Authentication context missing");
  }
  return userId;
}

export const GET = withApiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = getAuthenticatedUserId(req);
    const shopId = await getShopIdByOwner(userId);
    const { id } = await params;

    const medicine: Medicine = await getMedicineByIdService(id, shopId);
    return sendSuccess<{ medicine: Medicine }>({ medicine });
  }
);

export const PATCH = withApiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = getAuthenticatedUserId(req);
    const shopId = await getShopIdByOwner(userId);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if (body.quantity !== undefined) {
      const parsedQuantity = Number(body.quantity);
      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
        throw AppError.validation("Quantity must be a valid non-negative whole number");
      }
    }

    const updated: Medicine = await updateMedicineService({
      id,
      shopId,
      ...(body.description !== undefined && { description: String(body.description).trim() }),
      ...(body.batchNo !== undefined && { batchNo: String(body.batchNo).trim() }),
      ...(body.hsnCode !== undefined && { hsnCode: String(body.hsnCode).trim() }),
      ...(body.packSize !== undefined && { packSize: String(body.packSize).trim() }),
      ...(body.expDate !== undefined && { expDate: String(body.expDate).trim() }),
      ...(body.mrp !== undefined && { mrp: String(Number(body.mrp)) }),
      ...(body.rate !== undefined && { rate: String(Number(body.rate)) }),
      ...(body.gstRate !== undefined && { gstRate: String(Number(body.gstRate)) }),
      ...(body.quantity !== undefined && { quantity: Number(body.quantity) }),
    });

    return sendSuccess<{ medicine: Medicine }>({ medicine: updated }, "Medicine updated successfully");
  }
);

export const DELETE = withApiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const userId = getAuthenticatedUserId(req);
    const shopId = await getShopIdByOwner(userId);
    const { id } = await params;

    const result = await deleteMedicineService(id, shopId);
    return sendSuccess<{ message: string }>(result, "Medicine removed successfully");
  }
);