import { firecrawl } from "@/lib/firecrawl";

export async function POST(request: Request) {
  if (!process.env.FIRECRAWL_API_KEY) {
    return Response.json(
      { error: "FIRECRAWL_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    url?: unknown;
  } | null;

  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url) {
    return Response.json({ error: "A URL is required." }, { status: 400 });
  }

  const data = await firecrawl.scrape(url, {
    formats: ["markdown", "links"],
  });

  return Response.json(data);
}
