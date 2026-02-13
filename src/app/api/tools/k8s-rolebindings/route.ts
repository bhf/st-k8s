import { NextRequest, NextResponse } from "next/server";
import { getRoleBindings } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let namespace = searchParams.get("namespace");
  if (!namespace || !namespace.trim()) {
    namespace = "default";
  } else {
    namespace = namespace.trim();
  }

  try {
    const data = await getRoleBindings(namespace);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Error fetching role bindings:", err);
    return NextResponse.json(
      { error: "Failed to fetch role bindings" },
      { status: 500 }
    );
  }
}
