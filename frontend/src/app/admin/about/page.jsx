import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../utils/auth";
import AboutClient from "./AboutClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <AboutClient admin={admin} />;
}

