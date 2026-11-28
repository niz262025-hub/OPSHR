import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AccessError,
  brokerConfig,
  createBroker,
  readCookieClaims,
  SESSION_COOKIE,
} from "../../lib/myops-broker";
import EmployeeDirectory from "./employee-directory";

const MYOPS_HOME = "/api/myops-return";

export default async function EmployeesPage() {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionCookie) redirect(MYOPS_HOME);

  try {
    const config = brokerConfig();
    const claims = readCookieClaims(sessionCookie, config.secret);
    if (!claims || (config.organizationBound && !claims.organizationId)) throw new AccessError(401);

    await createBroker(config).validate(claims.sessionId, false, claims.organizationId);
  } catch (error) {
    if (error instanceof AccessError && error.status === 401) redirect(MYOPS_HOME);
    throw error;
  }

  return <EmployeeDirectory />;
}
