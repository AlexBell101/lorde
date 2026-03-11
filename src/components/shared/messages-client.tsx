"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, getInitials, cn } from "@/lib/utils";
import type { Message } from "@/types";

interface Conversation {
  id: string;
  landlord_id: string;
  renter_id: string;
  last_message?: string;
  last_message_at?: string;
  landlord: { id: string; full_name: string; avatar_url?: string };
  renter: { id: string; full_name: string; avatar_url?: string };
  properties?: { name?: string; city?: string; state?: string } | null;
}

interface MessagesClientProps {
  conversations: Conversation[];
  currentUserId: string;
  currentUserRole: string;
}

export function MessagesClient({
  conversations,
  currentUserId,
  currentUserRole,
}: MessagesClientProps) {
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;

    const supabase = createClient();

    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)")
        .eq("conversation_id", selected!.id)
        .order("created_at", { ascending: true });

      setMessages((data as unknown as Message[]) ?? []);

      // Mark as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", selected!.id)
        .eq("receiver_id", currentUserId);
    }

    loadMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`messages:${selected.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selected.id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select("*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();
          if (data) setMessages((prev) => [...prev, data as unknown as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim() || !selected) return;
    setSending(true);

    const supabase = createClient();
    const receiverId =
      currentUserId === selected.landlord_id
        ? selected.renter_id
        : selected.landlord_id;

    await supabase.from("messages").insert({
      conversation_id: selected.id,
      sender_id: currentUserId,
      receiver_id: receiverId,
      content: newMessage.trim(),
    });

    // Update conversation last message
    await supabase
      .from("conversations")
      .update({
        last_message: newMessage.trim(),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", selected.id);

    setNewMessage("");
    setSending(false);
  }

  function getOtherPerson(conv: Conversation) {
    return currentUserId === conv.landlord_id ? conv.renter : conv.landlord;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Conversation list */}
      <div className="w-72 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!conversations.length && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          )}

          {conversations.map((conv) => {
            const other = getOtherPerson(conv);
            return (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors text-left border-b border-border/50",
                  selected?.id === conv.id && "bg-secondary/70"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                  {getInitials(other.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium truncate">{other.full_name}</span>
                    {conv.last_message_at && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    )}
                  </div>
                  {conv.properties && (
                    <p className="text-xs text-muted-foreground">{(conv.properties as { name?: string } | null)?.name}</p>
                  )}
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message thread */}
      {selected ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-14 border-b border-border flex items-center px-5 gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {getInitials(getOtherPerson(selected).full_name)}
            </div>
            <div>
              <p className="text-sm font-medium">{getOtherPerson(selected).full_name}</p>
              {selected.properties && (
                <p className="text-xs text-muted-foreground">{(selected.properties as { name?: string } | null)?.name}</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={cn("flex", isMine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm",
                      isMine
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary text-foreground rounded-tl-sm"
                    )}
                  >
                    <p>{msg.content}</p>
                    <p className={cn("text-[10px] mt-1", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {formatRelativeTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex gap-3">
            <Input
              placeholder="Type a message…"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}
