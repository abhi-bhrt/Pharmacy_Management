// lib/auth/password.util.ts
import bcrypt from "bcryptjs";
import { BCRYPT_SALT_ROUNDS } from "@/config/constants";
import { AppError } from "@/lib/api/app-error";


export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 6) {
    throw AppError.validation("Password must be at least 6 characters long");
  }
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}


export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}