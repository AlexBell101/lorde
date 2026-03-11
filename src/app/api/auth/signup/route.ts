import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role } = await request.json();
    console.log("[signup] attempt", { email, role, full_name });

    const admin = await createAdminClient();

    // Step 1: create the auth user via admin API (bypasses GoTrue trigger issues)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so no email needed
      user_metadata: { full_name, role },
    });

    if (authError) {
      console.error("[signup] auth.admin.createUser failed:", authError);
      return NextResponse.json(
        { error: authError.message, code: authError.status },
        { status: 400 }
      );
    }

    const userId = authData.user.id;
    console.log("[signup] auth user created:", userId);

    // Step 2: manually upsert the profile (in case trigger didn't fire)
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: userId,
        email,
        full_name: full_name || "User",
        role: role || "renter",
      });

    if (profileError) {
      console.error("[signup] profile upsert failed:", profileError);
      // Don't block signup — auth user was created successfully
    } else {
      console.log("[signup] profile created for:", userId);
    }

    // Step 3: sign the user in to get a session
    const { data: signInData, error: signInError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (signInError) {
      console.error("[signup] generateLink failed:", signInError);
    }

    // Return success — client will sign in separately
    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error("[signup] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
