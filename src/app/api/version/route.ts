import { NextResponse } from "next/server";

// Embedded at build time from package.json
const CURRENT_VERSION = process.env.npm_package_version ?? "1.0.0";

const GITHUB_RELEASES_URL =
    "https://api.github.com/repos/bhf/st-k8s/releases/latest";

// Cache the upstream version check for 10 seconds to avoid hammering the API
let cachedLatest: { version: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 1000; // 10 seconds

async function getLatestVersion(): Promise<string | null> {
    const now = Date.now();
    if (cachedLatest && now - cachedLatest.fetchedAt < CACHE_TTL_MS) {
        return cachedLatest.version;
    }

    try {
        const res = await fetch(GITHUB_RELEASES_URL, {
            headers: { Accept: "application/vnd.github+json" },
            // next.js fetch cache — revalidate every 60 seconds
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const tag: string = data.tag_name ?? "";
        const version = tag.startsWith("v") ? tag.slice(1) : tag;
        if (version) {
            cachedLatest = { version, fetchedAt: now };
        }
        return version || null;
    } catch {
        return null;
    }
}

function isNewer(latest: string, current: string): boolean {
    const parse = (v: string) => v.split(".").map(Number);
    const [maj1, min1, pat1] = parse(latest);
    const [maj2, min2, pat2] = parse(current);
    if (maj1 !== maj2) return maj1 > maj2;
    if (min1 !== min2) return min1 > min2;
    return pat1 > pat2;
}

export async function GET() {
    const latestVersion = await getLatestVersion();
    const updateAvailable =
        latestVersion !== null && isNewer(latestVersion, CURRENT_VERSION);

    return NextResponse.json({
        version: CURRENT_VERSION,
        latestVersion,
        updateAvailable,
    });
}
