import { Router } from "express";
import {
  getInvoice,
  getMedicine,
  listMedicines,
  listShops,
  searchShops,
} from "@/controllers/public.controller";
import { authenticate } from "@/lib/auth/auth.middleware";

export const publicRouter = Router();

publicRouter.get("/medicines", listMedicines);
publicRouter.get("/medicines/:id", authenticate, getMedicine);
publicRouter.get("/shops/search", searchShops);
publicRouter.get("/shops", listShops);
publicRouter.get("/invoices/:id", getInvoice);
