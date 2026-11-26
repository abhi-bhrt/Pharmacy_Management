import { Router } from "express";
import {
  getProfile,
  updateProfile,
} from "@/controllers/user.controller";

export const userRouter = Router();

userRouter.get("/profile", getProfile);
userRouter.put("/profile", updateProfile);
userRouter.patch("/profile", updateProfile);
