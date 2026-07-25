import { listActiveSources } from "@/lib/supabase/queries/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sources = await listActiveSources();

    return Response.json(
      {
        sources: sources.map((source) => ({
          id: source.id,
          listingUrl: source.listing_url,
          logoUrl: source.logo_url,
          name: source.name,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    console.error("[sources] Unable to load active sources.");
    return Response.json(
      { error: "Unable to load sources." },
      {
        headers: {
          "Cache-Control": "no-store",
        },
        status: 500,
      },
    );
  }
}

