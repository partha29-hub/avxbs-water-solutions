import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../lib/adminAuth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const admin = await verifyAdmin();

  if (!admin) redirect("/admin/login");

  return <SettingsClient />;
}