import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { AdminUserTable } from "@/components/admin/admin-user-table";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const supabase = await createClient();
  const { q, role } = await searchParams;

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, role, phone, created_at")
    .order("created_at", { ascending: false });

  if (role && role !== "all") query = query.eq("role", role);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data: users } = await query.limit(200);

  const counts = {
    all:      users?.length ?? 0,
    admin:    users?.filter((u) => u.role === "admin").length ?? 0,
    support:  users?.filter((u) => u.role === "support").length ?? 0,
    landlord: users?.filter((u) => u.role === "landlord").length ?? 0,
    renter:   users?.filter((u) => u.role === "renter").length ?? 0,
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {counts.all} total · {counts.landlord} landlords · {counts.renter} renters · {counts.support + counts.admin} staff
        </p>
      </div>

      <AdminUserTable
        users={(users ?? []).map((u) => ({
          ...u,
          created_at: u.created_at ?? "",
          full_name: u.full_name ?? null,
          email: u.email ?? "",
          phone: u.phone ?? null,
        }))}
        currentQ={q ?? ""}
        currentRole={role ?? "all"}
        formatDate={formatDate}
      />
    </div>
  );
}
