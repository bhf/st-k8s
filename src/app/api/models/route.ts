import { NextResponse } from "next/server";
import { getModels } from "@/lib/copilot-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await getModels();
    return NextResponse.json({ models });
  } catch (err: unknown) {
    console.error("Error fetching models:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch models";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
