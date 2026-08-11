import { firecrawl } from "@/lib/firecrawl";

export async function POST(request: Request) {
  if (!process.env.FIRECRAWL_API_KEY) {
    return Response.json(
      { error: "FIRECRAWL_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    query?: unknown;
    limit?: unknown;
  } | null;

  const query = typeof body?.query === "string" ? body.query.trim() : "";

  if (!query) {
    return Response.json({ error: "A search query is required." }, { status: 400 });
  }

  const limit = typeof body?.limit === "number" ? body.limit : 5;
  const data = await firecrawl.search(query, { limit });

  return Response.json(data);
}
