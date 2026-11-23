import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AccessError,
  brokerConfig,
  createBroker,
  readCookie,
  SESSION_COOKIE,
} from "../../lib/myops-broker";
import EmployeeDirectory from "./employee-directory";

const MYOPS_HOME = "/api/myops-return";

export default async function EmployeesPage() {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionCookie) redirect(MYOPS_HOME);

  try {
    const config = brokerConfig();
    const sessionId = readCookie(sessionCookie, config.secret);
    if (!sessionId) throw new AccessError(401);

    await createBroker(config).validate(sessionId, false);
  } catch (error) {
    if (error instanceof AccessError && error.status === 401) redirect(MYOPS_HOME);
    throw error;
  }

  return <EmployeeDirectory />;
}
