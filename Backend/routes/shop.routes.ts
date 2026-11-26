import { Router } from "express";
import {
  createShop,
  getMyShop,
  removeShop,
  updateShop,
} from "@/controllers/shop.controller";

export const shopRouter = Router();

shopRouter.get("/", getMyShop);
shopRouter.post("/", createShop);
shopRouter.patch("/", updateShop);
shopRouter.delete("/", removeShop);
