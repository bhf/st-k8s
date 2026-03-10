import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/chat-service";

export async function POST(req: NextRequest) {
  try {
    const { message, model, attachments, isReadOnly } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await sendMessage(message, model, attachments, isReadOnly);
    return NextResponse.json({ response });
  } catch (err: unknown) {
    console.error("Chat error:", err);
    const message = err instanceof Error ? err.message : "Failed to process chat message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
