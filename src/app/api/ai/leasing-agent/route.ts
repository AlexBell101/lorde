import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface LeasingAgentContext {
  listingTitle: string;
  rentAmount: number;
  availableDate: string;
  leaseTermMonths: number;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  amenities: string[];
  unitFeatures: string[];
  description: string;
  propertyType: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildSystemPrompt(ctx: LeasingAgentContext): string {
  return `You are a friendly, professional leasing agent for ${ctx.listingTitle}, located at ${ctx.address}, ${ctx.city}, ${ctx.state}.

PROPERTY DETAILS:
- Type: ${ctx.propertyType}
- Bedrooms: ${ctx.bedrooms === 0 ? "Studio" : ctx.bedrooms}
- Bathrooms: ${ctx.bathrooms}
${ctx.squareFeet ? `- Size: ${ctx.squareFeet.toLocaleString()} sq ft` : ""}
- Rent: $${ctx.rentAmount.toLocaleString()}/month
- Available: ${new Date(ctx.availableDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
- Lease term: ${ctx.leaseTermMonths} months
${ctx.amenities.length ? `- Building amenities: ${ctx.amenities.join(", ")}` : ""}
${ctx.unitFeatures.length ? `- Unit features: ${ctx.unitFeatures.join(", ")}` : ""}

LISTING DESCRIPTION:
${ctx.description}

YOUR ROLE:
- Answer questions about this specific property honestly and helpfully
- Help prospective renters understand what's included, the neighborhood, lease terms
- Encourage qualified renters to apply — direct them to click "Apply now" if they express interest
- For scheduling tours, let them know they can message the landlord directly after applying or through the Messages feature
- For application requirements (income, credit), explain that the landlord reviews each application individually
- Do NOT make up information not in the property details above
- If asked something you don't know (e.g. exact utility costs, HOA rules), say you'll pass the question to the landlord
- Keep responses concise and conversational — 2-4 sentences max unless a detailed question warrants more
- You represent Lorde, a Cincinnati-focused rental platform that connects renters directly with landlords`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context }: { messages: ChatMessage[]; context: LeasingAgentContext } =
      await req.json();

    if (!messages?.length || !context) {
      return new Response(JSON.stringify({ error: "Missing messages or context" }), { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(context);

    // Stream the response
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Return as a ReadableStream (text/event-stream)
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[leasing-agent]", err);
    return new Response(JSON.stringify({ error: "Failed to process request" }), { status: 500 });
  }
}
