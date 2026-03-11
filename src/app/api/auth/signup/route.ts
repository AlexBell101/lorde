import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role } = await request.json();
    console.log("[signup] attempt", { email, role, full_name });

    const admin = await createAdminClient();

    // Step 1: create the auth user via admin API
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (authError) {
      console.error("[signup] auth.admin.createUser failed:", authError.message, authError.status);
      return NextResponse.json(
        { error: authError.message, code: authError.status },
        { status: 400 }
      );
    }

    const userId = authData.user.id;
    console.log("[signup] auth user created:", userId);

    // Step 2: upsert profile (handles case where trigger fired or didn't)
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: userId,
        email,
        full_name: full_name || "User",
        role: role || "renter",
      });

    if (profileError) {
      console.error("[signup] profile upsert failed:", profileError.message, profileError.code);
    } else {
      console.log("[signup] profile ready for:", userId);
    }

    // Step 3: create renter_profiles row if needed
    if (role === "renter") {
      const { error: renterError } = await admin
        .from("renter_profiles")
        .upsert({ user_id: userId });

      if (renterError) {
        console.error("[signup] renter_profile upsert failed:", renterError.message, renterError.code);
      } else {
        console.log("[signup] renter_profile ready for:", userId);
      }
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error("[signup] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
