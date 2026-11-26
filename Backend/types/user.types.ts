// types/user.types.ts
import type { Address, AddressInput, BaseEntity, UpdateAddressInput } from "./common.types";

export type UserRole = "CUSTOMER" | "PHARMACIST" | "ADMIN" | "SUPERADMIN";
export type UserStatus = "ACTIVE" | "DEACTIVATED" | "SUSPENDED";

export interface User extends BaseEntity {
  name: string;
  email: string;
  mob_no: string;
  role: UserRole;
  status: UserStatus;
  is_profile_complete: boolean;
  address_id: string | null;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface UserProfileResponse extends Omit<User, "address_id"> {
  address: Address | null;
}

export interface AuthResponse {
  user: UserProfileResponse;
  token: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export type SignInInput = Pick<UserWithPassword, "email" | "password">;

export type VerifyCredentialsRow = Pick<UserWithPassword, "id" | "email" | "password" | "role">;

export interface CreateUserInput extends SignInInput {
  name: string;
  mobNo: string;
  role?: UserRole;
  address?: AddressInput;
}

export interface UpdateUserInput extends Partial<Omit<CreateUserInput, "email" | "address">> {
  status?: UserStatus;
  isProfileComplete?: boolean;
  address?: UpdateAddressInput;
}

export interface FindUserCriteria {
  id?: string;
  email?: string;
  mobNo?: string;
}