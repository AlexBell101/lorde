import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    propertyName,
    propertyType,
    city,
    state,
    bedrooms,
    bathrooms,
    squareFeet,
    rentAmount,
    amenities,
    unitFeatures,
    availableDate,
    leaseTerm,
    yearBuilt,
    description: additionalNotes,
  } = await req.json();

  const prompt = `You are a professional real estate copywriter specializing in rental listings. Write a compelling, honest, and concise listing for the following rental property.

Property details:
- Property: ${propertyName} (${propertyType})
- Location: ${city}, ${state}
- Unit: ${bedrooms === 0 ? "Studio" : `${bedrooms} bedroom`}, ${bathrooms} bathroom${bathrooms !== 1 ? "s" : ""}
${squareFeet ? `- Size: ${squareFeet} sq ft` : ""}
- Rent: $${rentAmount}/month
- Available: ${availableDate}
- Lease term: ${leaseTerm} months
${yearBuilt ? `- Built: ${yearBuilt}` : ""}
${amenities?.length ? `- Building amenities: ${amenities.join(", ")}` : ""}
${unitFeatures?.length ? `- Unit features: ${unitFeatures.join(", ")}` : ""}
${additionalNotes ? `- Additional info: ${additionalNotes}` : ""}

Write a listing that includes:
1. An attention-grabbing opening sentence
2. 2-3 sentences highlighting the best features of the unit
3. 1-2 sentences about the building amenities (if any)
4. A brief neighborhood mention appropriate for the city
5. A closing call-to-action

Keep it between 120-200 words. Be specific, avoid clichés like "cozy" or "charming". Write in present tense. Do NOT include the price or specific dates in the description — those are shown separately.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "";

    return NextResponse.json({ description: text.trim() });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate listing copy" },
      { status: 500 }
    );
  }
}
