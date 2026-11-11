import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../utils/auth";
import ReviewsClient from "./ReviewsClient";

export const runtime = "nodejs";

export default async function AdminReviewsPage() {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <ReviewsClient admin={admin} />;
}

