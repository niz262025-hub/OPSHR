import "server-only";
import { getOpshrStagingPool } from "./opshr-db";
import {
  createPostgresEmployeeRepository,
  type EmployeeSqlPool,
} from "./employee-repository";

export function getOpshrEmployeeRepository() {
  const pool = getOpshrStagingPool();
  const employeePool: EmployeeSqlPool = {
    async connect() {
      const client = await pool.connect();
      return {
        async query<T extends object>(
          statement: string,
          values: readonly (string | number | null)[],
        ) {
          const result = await client.query(statement, [...values]);
          return { rows: result.rows as T[] };
        },
        release() {
          client.release();
        },
      };
    },
  };
  return createPostgresEmployeeRepository(employeePool);
}
