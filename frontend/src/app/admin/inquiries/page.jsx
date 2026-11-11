import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../utils/auth";
import InquiriesClient from "./InquiriesClient";

export const runtime = "nodejs";

export default async function InquiriesPage() {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <InquiriesClient admin={admin} />;
}

