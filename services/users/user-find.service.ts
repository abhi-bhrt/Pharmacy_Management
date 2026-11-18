// services/users/user-find.service.ts
import { pool, type DbExecutor } from "@/lib/db/client";
import { AppError } from "@/lib/api/app-error";
import type { User, FindUserCriteria } from "@/types";

export async function findUserByCriteria(
  criteria: FindUserCriteria,
  executor: DbExecutor = pool
): Promise<User | null> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (criteria.id) {
    clauses.push(`id = $${paramIndex++}`);
    values.push(criteria.id.trim());
  }

  if (criteria.email) {
    clauses.push(`email = $${paramIndex++}`);
    values.push(criteria.email.toLowerCase().trim());
  }

  if (criteria.mobNo) {
    clauses.push(`mob_no = $${paramIndex++}`);
    values.push(criteria.mobNo.trim());
  }

  if (clauses.length === 0) {
    return null;
  }

  const queryText = `
    SELECT id, name, email, mob_no, role, status, is_profile_complete, address_id, created_at, updated_at
    FROM users
    WHERE ${clauses.join(" OR ")}
    LIMIT 1
  `;

  try {
    const result = await executor.query<User>(queryText, values);
    return result.rows[0] ?? null;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "22P02") {
      throw AppError.validation("Invalid ID format in search criteria");
    }

    console.error("Error executing findUserByCriteria query:", error);

    throw AppError.internal("Internal server error while searching for user");
  }
}