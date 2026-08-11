"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  ArrowDown01Icon,
  Message01Icon,
  SparklesIcon,
  Tick02Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STEP_MS = 800;
const CLOSE_DELAY_MS = 500;
const ANSWER_DELAY_MS = 900;

const traceSteps = [
  {
    type: "thought",
    label: "Thought",
    text: "I need to confirm the patient before checking medication history.",
  },
  {
    type: "tool",
    label: "Look up patient",
    summary: "Nithin Kumar",
  },
  {
    type: "tool",
    label: "Open medication timeline",
    summary: "Last 30 days",
  },
  {
    type: "observation",
    label: "Observation",
    text: "Found one discontinued medication and one dosage increase.",
  },
] as const;
const traceTabs = [
  { value: "steps", label: "Steps" },
  { value: "reasoning", label: "Reasoning" },
  { value: "search", label: "Search" },
  { value: "coding", label: "Coding" },
] as const;

type TraceTabValue = (typeof traceTabs)[number]["value"];
type TraceStep =
  | {
      type: "thought" | "observation";
      label: string;
      text: string;
      hideIcon?: boolean;
      iconSrc?: string;
    }
  | {
      type: "tool";
      label: string;
      summary: string;
      hideIcon?: boolean;
      iconSrc?: string;
    };

const traceStepsByTab: Record<TraceTabValue, readonly TraceStep[]> = {
  steps: traceSteps,
  reasoning: [
    {
      type: "thought",
      label: "Reasoning",
      text: "The user is asking for recent medication changes, so I should ignore older prescriptions.",
      hideIcon: true,
    },
    {
      type: "thought",
      label: "Reasoning",
      text: "Only two records match the recent-change window.",
      hideIcon: true,
    },
    {
      type: "observation",
      label: "Answer",
      text: "Nithin Kumar has two recent medication changes.",
      hideIcon: true,
    },
  ],
  search: [
    {
      type: "tool",
      label: "Search sources",
      summary: "Google results",
      iconSrc: "/icons/google%20(3).svg",
    },
    {
      type: "tool",
      label: "Read page content",
      summary: "Firecrawl scrape",
      iconSrc: "/icons/firecrawl.svg",
    },
    {
      type: "tool",
      label: "Check preview",
      summary: "Vercel deployment",
      iconSrc: "/icons/vercel.svg",
    },
    {
      type: "tool",
      label: "Review styling",
      summary: "Tailwind classes",
      iconSrc: "/icons/tailwindcss.svg",
    },
    {
      type: "observation",
      label: "Observation",
      text: "Search, scraping, preview, and styling context are ready to review.",
    },
  ],
  coding: [
    {
      type: "tool",
      label: "Edit component",
      summary: "app/trace-demo/page.tsx",
      iconSrc: "/file.svg",
    },
    {
      type: "tool",
      label: "Update route",
      summary: "app/chat/route.ts",
      iconSrc: "/file.svg",
    },
    {
      type: "tool",
      label: "Add asset",
      summary: "public/icons/firecrawl.svg",
      iconSrc: "/file.svg",
    },
    {
      type: "tool",
      label: "Verify build",
      summary: "TypeScript and ESLint passed",
      iconSrc: "/window.svg",
    },
  ],
};

const answersByTab: Record<TraceTabValue, string> = {
  steps:
    "Nithin Kumar has two recent medication changes: amoxicillin was discontinued, and salbutamol was increased from 2.5mg to 5mg.",
  reasoning:
    "After filtering for recent changes, there are two relevant medication updates for Nithin Kumar.",
  search:
    "Search found the relevant sources, checked the preview, and prepared the styling context for review.",
  coding:
    "The component update is complete and passed TypeScript and ESLint checks.",
};

function useTypewriter(text: string, start: boolean, speed = 35) {
  const [output, setOutput] = useState("");

  useEffect(() => {
    if (!start) {
      const timer = setTimeout(() => setOutput(""), 0);
      return () => clearTimeout(timer);
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      const timer = setTimeout(() => setOutput(text), 0);
      return () => clearTimeout(timer);
    }

    let index = 0;

    const timer = setInterval(() => {
      index += 1;
      setOutput(text.slice(0, index));

      if (index >= text.length) {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, start, speed]);

  return output;
}

function getStepIcon(type: TraceStep["type"]) {
  if (type === "thought") return AiBrain01Icon;
  if (type === "tool") return Wrench01Icon;
  return Message01Icon;
}

export default function AgentTrace() {
  const [revealed, setRevealed] = useState(0);
  const [open, setOpen] = useState(true);
  const [activeTrace, setActiveTrace] = useState<TraceTabValue>("steps");
  const activeSteps = traceStepsByTab[activeTrace];
  const done = revealed >= activeSteps.length;
  const [showAnswer, setShowAnswer] = useState(false);
  const answer = answersByTab[activeTrace];

  const typedAnswer = useTypewriter(answer, showAnswer);
  const isTyping = typedAnswer.length < answer.length;
  const answerDone = showAnswer && typedAnswer.length >= answer.length;
  const canToggleTrace = !done || answerDone;
  const traceOpen = open && canToggleTrace;

  useEffect(() => {
    if (revealed >= activeSteps.length) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      const timer = setTimeout(() => {
        setRevealed(activeSteps.length);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setRevealed((current) => current + 1);
    }, STEP_MS);

    return () => clearTimeout(timer);
  }, [activeSteps.length, revealed]);

  useEffect(() => {
    if (!done) return;

    const closeTimer = setTimeout(() => {
      setOpen(false);
    }, CLOSE_DELAY_MS);

    const answerTimer = setTimeout(() => {
      setShowAnswer(true);
    }, ANSWER_DELAY_MS);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(answerTimer);
    };
  }, [done]);
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Collapsible
          open={traceOpen}
          onOpenChange={(nextOpen) => {
            if (canToggleTrace) {
              setOpen(nextOpen);
            }
          }}
        >
          <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
            <HugeiconsIcon
              icon={SparklesIcon}
              size={16}
              className="shrink-0 text-muted-foreground"
            />

            <span className="text-[13px] font-medium text-foreground/80">
              {done ? "Thought for 6 seconds" : "Thinking..."}
            </span>

            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={14}
              className="ml-auto shrink-0 text-muted-foreground transition-transform duration-300 group-data-panel-open:rotate-180"
            />
          </CollapsibleTrigger>
          <CollapsibleContent
            className="h-(--collapsible-panel-height) overflow-hidden
    opacity-100 transition-[height,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
    [&[hidden]:not([hidden='until-found'])]:hidden
    data-ending-style:h-0 data-ending-style:opacity-0
            data-starting-style:h-0 data-starting-style:opacity-0"
          >
            <div className="relative mt-2 pl-5">
              {activeTrace !== "reasoning" && (
                <span className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
              )}
              <div className="space-y-1">
                {activeSteps.slice(0, revealed).map((step, index) => {
                  const isTool = step.type === "tool";
                  const isActive =
                    index === revealed - 1 && revealed < activeSteps.length;
                  return (
                    <div
                      key={index}
                      className=" relative flex gap-2.5 text-sm"
                      style={{
                        animation:
                          "fade-up 320ms cubic-bezier(0.23,1,0.32,1) both",
                      }}
                    >
                      {!step.hideIcon && (
                        <span className="z-10 mt-0.5 flex size-4 shrink-0 items-center justify-center bg-background text-[11px] text-muted-foreground">
                          {step.iconSrc ? (
                            <Image
                              src={step.iconSrc}
                              alt=""
                              width={14}
                              height={14}
                              className="size-3.5"
                              aria-hidden
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={getStepIcon(step.type)}
                              size={13}
                              strokeWidth={1.6}
                            />
                          )}
                        </span>
                      )}
                      <div>
                        <p className="text-[12px] font-medium leading-5 text-muted-foreground">
                          {step.label}
                        </p>
                        {"text" in step && (
                          <p className="text-[12px] leading-5 text-foreground/75">
                            {step.text}
                          </p>
                        )}
                        {"summary" in step && (
                          <p className="flex items-center gap-1.5 text-[12px] leading-5 text-muted-foreground/80">
                            {isTool && (
                              <>
                                {isActive ? (
                                  <span className="size-2.5 shrink-0 animate-spin rounded-full border border-muted-foreground/30 border-t-muted-foreground" />
                                ) : (
                                  <HugeiconsIcon
                                    icon={Tick02Icon}
                                    size={11}
                                    className="shrink-0 text-muted-foreground"
                                  />
                                )}
                              </>
                            )}

                            {step.summary}
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

        {showAnswer && (
          <p className="mt-3 text-sm leading-relaxed">
            {typedAnswer}
            {isTyping && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground align-middle" />
            )}
          </p>
        )}

        <Tabs
          value={activeTrace}
          onValueChange={(value) => {
            setActiveTrace(value as TraceTabValue);
            setRevealed(0);
            setShowAnswer(false);
            setOpen(true);
          }}
          className="mt-5 w-full"
        >
          <TabsList className="w-full">
            {traceTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="min-w-0 text-[13px]"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </main>
  );
}
