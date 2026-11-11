
import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../utils/auth";
import DynamicTabsClient from "./DynamicTabsClient";

export const runtime = "nodejs";

export default async function DynamicTabsPage() {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <DynamicTabsClient admin={admin} />;
}
