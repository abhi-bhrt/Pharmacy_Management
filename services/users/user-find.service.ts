// services/users/user-find.service.ts
import { pool, type DbExecutor } from "@/lib/db/client";
import type { UserProfileResponse, FindUserCriteria } from "@/types";

export async function findUserByCriteria(
  criteria: FindUserCriteria,
  executor: DbExecutor = pool
): Promise<UserProfileResponse | null> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (criteria.id) {
    clauses.push(`id = $${paramIndex++}`);
    values.push(criteria.id);
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
    SELECT *
    FROM users
    WHERE ${clauses.join(" OR ")}
    LIMIT 1
  `;

  try {

    const result = await executor.query<UserProfileResponse>(queryText, values);

    return result.rows[0] ?? null;

  } catch (error) {

    console.error("Error executing findUserByCriteria query:", error);
    
    throw error;

  }
}