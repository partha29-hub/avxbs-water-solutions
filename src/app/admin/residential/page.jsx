
import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../lib/adminAuth";
import ResidentialClient from "./ResidentialClient";

export const runtime = "nodejs";

export default async function ResidentialPage() {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <ResidentialClient admin={admin} />;
}
