import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-8 text-foreground sm:px-10">
      <div className="mx-auto max-w-4xl">
        <nav className="flex items-center text-[15px]">
          <p className="font-semibold">components.</p>
        </nav>

        <section className="pt-20 sm:pt-24">
          <h1 className="text-[15px] font-semibold leading-tight">
            Components for AI agents.
          </h1>
        </section>

        <section className="pt-20 text-[14px] leading-6">
          <Link
            href="/trace-demo"
            className="group w-fit transition-opacity hover:opacity-70"
          >
            <span className="font-semibold">Agent Trace</span>
            <span className="text-muted-foreground"> — Tool Calling</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
