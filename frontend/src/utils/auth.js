import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Server-side verification for Next.js App Router Server Components.
 * Queries the Express backend to validate the admin_token cookie.
 */
export async function verifyAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/account`, {
      method: "GET",
      headers: {
        Cookie: `admin_token=${token}`,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.admin) {
      return data.admin;
    }

    return null;
  } catch (error) {
    console.warn("[Auth] verifyAdmin server verification error:", error.message);
    return null;
  }
}

