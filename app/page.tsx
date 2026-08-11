"use client";

import { useState } from "react";

// Shape of a single web result from Firecrawl.
type WebResult = {
  url: string;
  title: string;
  description: string;
  position: number;
};

export default function SearchTestPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WebResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    try {
      const res = await fetch("/api/firecrawl/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      setResults(data.web ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-2xl font-semibold">Search test</h1>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Type a query..."
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <ul className="mt-6 space-y-4">
        {results.map((r) => (
          <li key={r.url} className="rounded border p-4">
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              {r.title}
            </a>
            <p className="mt-1 text-sm text-gray-600">{r.description}</p>
            <p className="mt-1 text-xs text-gray-400">{r.url}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
