import { NextRequest, NextResponse } from "next/server";
import { getServiceAccounts } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let namespace = searchParams.get("namespace");
  if (!namespace || !namespace.trim()) {
    namespace = "default";
  } else {
    namespace = namespace.trim();
  }
  const context = searchParams.get("context") || undefined;

  try {
    const data = await getServiceAccounts(namespace, context);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Error fetching service accounts:", err);
    return NextResponse.json(
      { error: "Failed to fetch service accounts" },
      { status: 500 }
    );
  }
}
