
import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../lib/adminAuth";
import VideoClient from "./VideoClient";

export const runtime = "nodejs";

export default async function VideosPage() {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <VideoClient admin={admin} />;
}
