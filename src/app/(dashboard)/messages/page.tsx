import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MessageSquare } from "lucide-react";
import { MessagesClient } from "@/components/shared/messages-client";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      *,
      landlord:profiles!conversations_landlord_id_fkey(id, full_name, avatar_url),
      renter:profiles!conversations_renter_id_fkey(id, full_name, avatar_url),
      properties(name, city, state)
    `)
    .or(`landlord_id.eq.${user.id},renter_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  return (
    <div className="h-full flex">
      <MessagesClient
        conversations={conversations ?? []}
        currentUserId={user.id}
        currentUserRole={profile?.role ?? "renter"}
      />
    </div>
  );
}
