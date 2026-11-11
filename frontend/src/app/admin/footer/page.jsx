
import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../utils/auth";
import FooterClient from "./FooterClient";

export const runtime = "nodejs";

export default async function AdminFooterPage() {
  const admin = await verifyAdmin();

  if (!admin) redirect("/admin/login");

  return <FooterClient admin={admin} />;
}
