import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.adminId || decoded.role !== "admin") {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}