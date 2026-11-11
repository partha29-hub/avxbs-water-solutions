
import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../lib/adminAuth";
import SolutionClient from "./SolutionClient";

export const runtime = "nodejs";

export default async function SolutionsPage() {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <SolutionClient admin={admin} />;
}
