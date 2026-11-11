import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../utils/auth";
import BannersClient from "./BannersClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Banner Management | AVXBS Admin",
  description: "Manage homepage hero banners, audience targeting, desktop/mobile images, and call-to-actions.",
};

export default async function AdminBannersPage() {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <BannersClient admin={admin} />;
}
