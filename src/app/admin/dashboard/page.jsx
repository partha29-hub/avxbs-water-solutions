
import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../lib/adminAuth";
import DashboardClient from "./DashboardClient";

export const runtime = "nodejs";

export default async function AdminDashboardPage() {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <DashboardClient admin={admin} />;
}
