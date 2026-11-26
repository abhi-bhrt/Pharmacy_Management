import { Router } from "express";
import { searchUsers } from "@/controllers/user.controller";
import { authenticate } from "@/lib/auth/auth.middleware";
import { invoiceRouter } from "./invoice.routes";
import { medicineRouter } from "./medicine.routes";
import { shopRouter } from "./shop.routes";
import { userRouter } from "./user.routes";

export const protectedRouter = Router();

protectedRouter.use(authenticate);
protectedRouter.use("/medicines", medicineRouter);
protectedRouter.use("/shops", shopRouter);
protectedRouter.use("/invoices", invoiceRouter);
protectedRouter.get("/users/search", searchUsers);
protectedRouter.use("/users", userRouter);
