
import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../utils/auth";
import DashboardClient from "./DashboardClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <DashboardClient admin={admin} />;
}
