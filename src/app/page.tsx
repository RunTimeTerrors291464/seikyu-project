import {
  defaultHomePathForRoles,
} from "@/lib/auth/authUser";
import {
  ACCESS_TOKEN_COOKIE,
  parseUserRolesCookie,
  USER_ROLES_COOKIE,
} from "@/lib/auth/authCookies";
import { isCashierInvoiceHideEnabled } from "@/lib/config/featureFlags";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (token) {
    const roles = parseUserRolesCookie(
      cookieStore.get(USER_ROLES_COOKIE)?.value,
    );
    redirect(
      roles.length > 0
        ? defaultHomePathForRoles(roles, isCashierInvoiceHideEnabled())
        : "/admin/dashboard",
    );
  }

  redirect("/login");
}
