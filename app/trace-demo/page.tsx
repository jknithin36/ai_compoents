"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  ArrowDown01Icon,
  Message01Icon,
  Wrench01Icon,
  UserSearch01Icon,
  Medicine02Icon,
  AiBrain01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

const STEP_MS = 850;
const TRACE_CLOSE_MS = 760;

const ANSWER =
  "Nithin Kumar (PICU) has two recent medication changes: amoxicillin was discontinued and salbutamol increased from 2.5mg to 5mg.";

// the trace = the agent's work. the answer is separate (streams below).
const mockParts = [
  {
    kind: "thought",
    text: "I need to confirm the patient before pulling any records.",
  },
  {
    kind: "tool",
    tool: "lookupPatient",
    label: "Look up patient",
    summary: "Nithin Kumar",
  },
  {
    kind: "tool",
    tool: "getMedicationHistory",
    label: "Get medication history",
    summary: "PT-4821 · last 30 days",
  },
  { kind: "observation", text: "Found 2 recent medication changes." },
] as const;

const TOOL_ICONS = {
  lookupPatient: UserSearch01Icon,
  getMedicationHistory: Medicine02Icon,
} as const;

// single source of truth for how each node type looks
function nodeMeta(part: (typeof mockParts)[number]) {
  switch (part.kind) {
    case "thought":
      return {
        icon: AiBrain01Icon,
        label: "Thought",
        iconClass: "text-muted-foreground",
      };
    case "observation":
      return {
        icon: Message01Icon,
        label: "Observation",
        iconClass: "text-muted-foreground",
      };
    case "tool":
      return {
        icon: TOOL_ICONS[part.tool as keyof typeof TOOL_ICONS] ?? Wrench01Icon,
        label: part.label,
        iconClass: "text-muted-foreground",
      };
  }
}

// types out `text` once `start` flips true; respects reduced motion
function useTypewriter(text: string, start: boolean, cps = 45) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!start) {
      setOut("");
      return;
    }
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setOut(text);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 1000 / cps);
    return () => clearInterval(id);
  }, [text, start]);
  return out;
}

export default function AgentTrace() {
  const [open, setOpen] = useState(true);
  const [revealed, setRevealed] = useState(0);
  const [answerReady, setAnswerReady] = useState(false);
  const done = revealed >= mockParts.length;
  const answer = useTypewriter(ANSWER, answerReady);
  const answering = answer.length < ANSWER.length;
  const answerComplete = answerReady && !answering;
  const canToggleTrace = !done || answerComplete;
  const traceOpen = open && canToggleTrace;

  // playback engine: reveal one node at a time
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setRevealed(mockParts.length);
      setOpen(false);
      return;
    }
    if (!done) {
      const t = setTimeout(() => {
        setRevealed((n) => {
          const next = n + 1;
          if (next >= mockParts.length) {
            setOpen(false);
          }
          return next;
        });
      }, STEP_MS);
      return () => clearTimeout(t);
    }
  }, [revealed, done]);

  useEffect(() => {
    const t = setTimeout(() => setAnswerReady(done), done ? TRACE_CLOSE_MS : 0);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-6 py-10 sm:px-10">
      <div className="w-full max-w-md">
        <Collapsible
          open={traceOpen}
          onOpenChange={(nextOpen) => {
            if (canToggleTrace) {
              setOpen(nextOpen);
            }
          }}
        >
          <CollapsibleTrigger
            className="group flex w-full items-center gap-2 rounded-md px-1.5 py-1
              text-left outline-none transition-colors hover:bg-accent
              focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <HugeiconsIcon
              icon={SparklesIcon}
              size={16}
              className="shrink-0 text-muted-foreground"
            />

            {done ? (
              <span
                className="text-[13px] font-medium text-foreground/80"
                style={{ animation: "fade-in 350ms ease-out both" }}
              >
                Thought for 6 seconds
              </span>
            ) : (
              <span
                className="bg-clip-text text-[13px] font-medium text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, var(--muted-foreground) 35%, var(--foreground) 50%, var(--muted-foreground) 65%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer-text 1.4s linear infinite",
                }}
              >
                Thinking…
              </span>
            )}

            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={14}
              className="ml-auto shrink-0 text-muted-foreground transition-transform
                duration-300 group-data-[panel-open]:rotate-180"
            />
          </CollapsibleTrigger>

          <CollapsibleContent
            className="h-[var(--collapsible-panel-height)] overflow-hidden
              opacity-100 transition-[height,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
              [&[hidden]:not([hidden='until-found'])]:hidden
              data-ending-style:h-0 data-ending-style:opacity-0
              data-starting-style:h-0 data-starting-style:opacity-0"
          >
            {/* relative wrapper owns the spine */}
            <div className="relative pt-2 pl-1">
              <span
                aria-hidden
                className="absolute left-[9px] top-4 bottom-3 w-px bg-border/70"
              />

              <div className="space-y-0.5">
                {mockParts.slice(0, revealed).map((part, i) => {
                  const { icon, label, iconClass } = nodeMeta(part)!;
                  const isTool = part.kind === "tool";
                  const isActive = i === revealed - 1 && !done;
                  return (
                    <div
                      key={i}
                      className="relative flex gap-2.5"
                      style={{
                        animation:
                          "fade-up 320ms cubic-bezier(0.23,1,0.32,1) both",
                      }}
                    >
                      <div
                        className={`z-10 mt-0.5 flex size-4 shrink-0 items-center
                          justify-center bg-background ${iconClass}`}
                      >
                        <HugeiconsIcon
                          icon={icon}
                          size={13}
                          strokeWidth={1.6}
                        />
                      </div>
                      <div className="min-w-0 flex-1 pb-2.5">
                        <p className="text-[12px] font-medium leading-5 text-muted-foreground">
                          {label}
                        </p>
                        {"text" in part && (
                          <p className="text-[12px] leading-5 text-foreground/75">
                            {part.text}
                          </p>
                        )}
                        {isTool && (
                          <p className="flex items-center gap-1.5 text-[12px] leading-5 text-muted-foreground/80">
                            {isActive ? (
                              <span
                                className="size-2.5 shrink-0 rounded-full border
                                  border-muted-foreground/30 border-t-muted-foreground"
                                style={{
                                  animation: "spin 700ms linear infinite",
                                }}
                              />
                            ) : (
                              <HugeiconsIcon
                                icon={Tick02Icon}
                                size={11}
                                className="shrink-0 text-muted-foreground"
                              />
                            )}
                            {part.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* the real reply — lives outside the trace, streams in */}
        {answerReady && (
          <p
            className="mt-3 text-[14px] leading-relaxed text-foreground"
            style={{ animation: "fade-in 300ms ease-out both" }}
          >
            {answer}
            {answering && (
              <span
                className="ml-0.5 inline-block h-4 w-[2px] -translate-y-[1px]
                  animate-pulse bg-foreground align-middle"
              />
            )}
          </p>
        )}
      </div>
    </main>
  );
}
