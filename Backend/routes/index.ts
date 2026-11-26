import { Router } from "express";
import { authRouter } from "./auth.routes";
import { protectedRouter } from "./protected.routes";
import { publicRouter } from "./public.routes";
import { userRouter } from "./user.routes";
import { authenticate } from "@/lib/auth/auth.middleware";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/", publicRouter);
apiRouter.use("/users", authenticate, userRouter);
apiRouter.use("/protected", protectedRouter);
