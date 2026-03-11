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

  const { zipCode, bedrooms, bathrooms, squareFeet, amenities } = await req.json();

  // Get comparable listings from our database
  const { data: comparables } = await supabase
    .from("listings")
    .select("rent_amount, units(bedrooms, bathrooms, square_feet)")
    .eq("status", "active")
    .in("property_id",
      supabase
        .from("properties")
        .select("id")
        .eq("zip_code", zipCode) as unknown as string[]
    )
    .limit(20);

  type Comparable = { rent_amount: number; units: { bedrooms?: number; bathrooms?: number; square_feet?: number } | null };
  const comparableData = (comparables as unknown as Comparable[]) ?? [];

  const prompt = `You are a real estate pricing expert. Based on the following information, provide a rental price recommendation.

Target property:
- ZIP code: ${zipCode}
- Bedrooms: ${bedrooms === 0 ? "Studio" : bedrooms}
- Bathrooms: ${bathrooms}
${squareFeet ? `- Square feet: ${squareFeet}` : ""}
${amenities?.length ? `- Amenities: ${amenities.join(", ")}` : ""}

${
  comparableData.length > 0
    ? `Comparable listings in the same ZIP code:
${comparableData
  .map((c) => {
    const u = c.units;
    return `- $${c.rent_amount}/mo, ${u?.bedrooms}BD/${u?.bathrooms}BA${u?.square_feet ? `, ${u.square_feet}sqft` : ""}`;
  })
  .join("\n")}`
    : "No comparable listings found in our database."
}

Respond with a JSON object only (no other text):
{
  "recommended_price": <number>,
  "min_price": <number>,
  "max_price": <number>,
  "avg_comparable": <number or null>,
  "confidence": "low" | "medium" | "high",
  "comparables_count": <number>,
  "reasoning": "<1-2 sentence explanation>"
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "{}";

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Price recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate price recommendation" },
      { status: 500 }
    );
  }
}
