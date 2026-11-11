
import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../lib/adminAuth";
import FooterClient from "./FooterClient";

export const runtime = "nodejs";

export default async function AdminFooterPage() {
  const admin = await verifyAdmin();

  if (!admin) redirect("/admin/login");

  return <FooterClient admin={admin} />;
}
