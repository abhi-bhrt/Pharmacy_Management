import { Router } from "express";
import {
  createMedicine,
  getMedicine,
  listMedicines,
  removeMedicine,
  updateMedicine,
} from "@/controllers/medicine.controller";

export const medicineRouter = Router();

medicineRouter.get("/", listMedicines);
medicineRouter.post("/", createMedicine);
medicineRouter.get("/:id", getMedicine);
medicineRouter.patch("/:id", updateMedicine);
medicineRouter.delete("/:id", removeMedicine);
