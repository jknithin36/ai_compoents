"use client";
/* eslint-disable react-hooks/refs -- false positive: menuItems is plain render
   data, but the rule taints any read of it because one entry's onSelect
   closure touches fileInputRef. See facebook/react#35813. */

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AiMicIcon,
  ArrowDown01Icon,
  ArrowUp02Icon,
  Attachment02Icon,
  Brain02Icon,
  Cancel02Icon,
  Files01Icon,
  GitCompareIcon,
  GlobalIcon,
  Loading03Icon,
  Note03Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  Search01Icon,
  SourceCodeIcon,
  StopIcon,
  Target02Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ItemIcon =
  | { kind: "image"; src: string; background?: string }
  | { kind: "hugeicon"; icon: IconSvgElement };

function parseToken(draft: string) {
  const match = /(^|\s)([@/])([\w-]*)$/.exec(draft);
  if (!match) return null;
  return {
    kind: match[2] === "@" ? "source" : "command",
    query: match[3].toLowerCase(),
    start: match.index + match[1].length,
  };
}

const commands = [
  {
    key: "summarize",
    name: "/summarize",
    description: "Summarize the current context",
    icon: { kind: "hugeicon", icon: Note03Icon } as const,
  },
  {
    key: "compare",
    name: "/compare",
    description: "Compare two options",
    icon: { kind: "hugeicon", icon: GitCompareIcon } as const,
  },
  {
    key: "draft",
    name: "/draft",
    description: "Draft a response",
    icon: { kind: "hugeicon", icon: PencilEdit02Icon } as const,
  },
  {
    key: "search",
    name: "/search",
    description: "Search public sources",
    icon: { kind: "hugeicon", icon: Search01Icon } as const,
  },
  {
    key: "code",
    name: "/code",
    description: "Make a code change",
    icon: { kind: "hugeicon", icon: SourceCodeIcon } as const,
  },
] as const;

const sources = [
  {
    key: "web",
    name: "Web",
    description: "Search public sources",
    icon: { kind: "hugeicon", icon: GlobalIcon } as const,
    connected: true,
  },
  {
    key: "files",
    name: "Files",
    description: "Use uploaded documents",
    icon: { kind: "hugeicon", icon: Files01Icon } as const,
    connected: true,
  },
  {
    key: "figma",
    name: "Figma",
    description: "Use design context",
    icon: { kind: "image", src: "/icons/figma.svg" } as const,
    connected: true,
  },
  {
    key: "slack",
    name: "Slack",
    description: "Use team conversations",
    icon: { kind: "image", src: "/icons/slack.svg" } as const,
    connected: true,
  },
  {
    key: "gmail",
    name: "Gmail",
    description: "Read email context",
    icon: { kind: "image", src: "/icons/google-gmail.svg" } as const,
    connected: false,
  },
  {
    key: "vercel",
    name: "Vercel",
    description: "Deployments and projects",
    icon: {
      kind: "image",
      src: "/icons/vercel.svg",
      background: "bg-black",
    } as const,
    connected: false,
  },
  {
    key: "notion",
    name: "Notion",
    description: "Use pages and databases",
    icon: { kind: "image", src: "/icons/notion.svg" } as const,
    connected: false,
  },
  {
    key: "canva",
    name: "Canva",
    description: "Create, review, edit designs",
    icon: { kind: "image", src: "/icons/canva.svg" } as const,
    connected: false,
  },
] as const;

function SourceIcon({ icon }: { icon: ItemIcon }) {
  if (icon.kind === "image") {
    const image = (
      <Image
        src={icon.src}
        alt=""
        width={12}
        height={12}
        className="size-3 shrink-0"
        aria-hidden="true"
      />
    );
    if (icon.background) {
      return (
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-full p-0.5",
            icon.background,
          )}
        >
          {image}
        </span>
      );
    }
    return image;
  }
  return (
    <HugeiconsIcon
      icon={icon.icon}
      size={12}
      strokeWidth={2}
      aria-hidden="true"
      className="shrink-0 text-muted-foreground"
    />
  );
}
const models = [
  {
    key: "fast",
    name: "Fast",
    description: "Quick everyday tasks",
    icon: { kind: "hugeicon", icon: ZapIcon } as const,
  },
  {
    key: "balanced",
    name: "Balanced",
    description: "Best default choice",
    icon: { kind: "hugeicon", icon: Target02Icon } as const,
  },
  {
    key: "advanced",
    name: "Advanced",
    description: "Harder reasoning",
    icon: { kind: "hugeicon", icon: Brain02Icon } as const,
  },
] as const;
type Model = (typeof models)[number];

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

function formatFileSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

export default function PromptDemoPage() {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>(models[1]);
  const [activeModelIndex, setActiveModelIndex] = useState(1);
  const [listening, setListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [connectedSources, setConnectedSources] = useState<
    Record<string, boolean>
  >(() => Object.fromEntries(sources.map((source) => [source.key, source.connected])));

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = dismissed ? null : parseToken(draft);
  const commandOpen = token?.kind === "command";
  const sourceOpen = token?.kind === "source";
  const menuOpen = commandOpen || sourceOpen;
  const hasContent = draft.trim().length > 0 || attachments.length > 0;

  const tokenKey = token ? `${token.kind}:${token.query}` : null;
  const [prevTokenKey, setPrevTokenKey] = useState(tokenKey);
  if (prevTokenKey !== tokenKey) {
    setPrevTokenKey(tokenKey);
    setActiveCommandIndex(0);
    setActiveSourceIndex(0);
  }

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";

    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [draft]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (composerRef.current?.contains(target)) return;

      setDismissed(true);
      setModelOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (sendTimerRef.current) {
        clearTimeout(sendTimerRef.current);
      }
    };
  }, []);

  function handleSend() {
    if (isSending) {
      if (sendTimerRef.current) {
        clearTimeout(sendTimerRef.current);
        sendTimerRef.current = null;
      }
      setIsSending(false);
      return;
    }

    const message = draft.trim();
    if (!message && attachments.length === 0) {
      textareaRef.current?.focus();
      return;
    }

    console.log("Send:", {
      message,
      attachments: attachments.map((file) => file.name),
      model: selectedModel.key,
    });
    setDraft("");
    setAttachments([]);
    setAttachmentError(null);
    setDismissed(true);
    setModelOpen(false);
    setIsSending(true);

    sendTimerRef.current = setTimeout(() => {
      setIsSending(false);
      sendTimerRef.current = null;
    }, 1400);
  }

  function openSourceMenu() {
    setDraft((current) => {
      if (/[@/][\w-]*$/.test(current)) return current;
      if (!current) return "@";
      const needsSpace = !/\s$/.test(current);
      return `${current}${needsSpace ? " " : ""}@`;
    });
    setDismissed(false);
    setModelOpen(false);
    textareaRef.current?.focus();
  }

  function handleAttachClick() {
    if (token) {
      setDraft((current) => current.slice(0, token.start));
    }
    setDismissed(true);
    fileInputRef.current?.click();
  }

  const filteredCommands =
    commandOpen && token
      ? commands.filter((command) =>
          command.name.slice(1).startsWith(token.query),
        )
      : [];

  const filteredSources =
    sourceOpen && token
      ? sources.filter((source) =>
          source.name.toLowerCase().startsWith(token.query),
        )
      : [];

  const uploadMatches =
    sourceOpen && token
      ? "add photos & files".startsWith(token.query)
      : false;

  function applyCommand(command: (typeof commands)[number]) {
    if (!token) return;
    setDraft((current) => {
      const before = current.slice(0, token.start);
      return `${before}${command.name} `;
    });
    setDismissed(true);
    textareaRef.current?.focus();
  }

  function applySource(source: (typeof sources)[number]) {
    if (!token) return;
    setDraft((current) => {
      const before = current.slice(0, token.start);
      return `${before}@${source.name} `;
    });
    setDismissed(true);
    textareaRef.current?.focus();
  }

  function toggleConnected(key: string) {
    setConnectedSources((current) => ({ ...current, [key]: true }));
  }

  const menuItems = commandOpen
    ? filteredCommands.map((command) => ({
        key: command.key,
        name: command.name,
        description: command.description,
        icon: command.icon,
        isSource: false,
        connected: true,
        onSelect: () => applyCommand(command),
      }))
    : sourceOpen
      ? [
          ...(uploadMatches
            ? [
                {
                  key: "upload",
                  name: "Add photos & files",
                  description: "Upload from your computer",
                  icon: { kind: "hugeicon", icon: Attachment02Icon } as const,
                  isSource: false,
                  connected: true,
                  onSelect: () => handleAttachClick(),
                },
              ]
            : []),
          ...filteredSources.map((source) => ({
            key: source.key,
            name: `@${source.name}`,
            description: source.description,
            icon: source.icon,
            isSource: true,
            connected: connectedSources[source.key] ?? source.connected,
            onSelect: () => applySource(source),
          })),
        ]
      : [];
  const activeMenuIndex = commandOpen ? activeCommandIndex : activeSourceIndex;

  function setActiveMenuIndex(index: number) {
    if (commandOpen) {
      setActiveCommandIndex(index);
    } else {
      setActiveSourceIndex(index);
    }
  }

  function applyActiveMenuItem() {
    const item = menuItems[activeMenuIndex];
    if (!item) return;
    item.onSelect();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div
        ref={composerRef}
        className={cn(
          "relative w-full max-w-2xl rounded-2xl border bg-background p-3 shadow-sm transition-colors",
          isSending && "border-primary/30",
        )}
      >
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setDismissed(false);
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              handleSend();
              return;
            }

            if (event.key === "Escape") {
              if (menuOpen || modelOpen) {
                event.preventDefault();
                setDismissed(true);
                setModelOpen(false);
              }
              return;
            }

            if (menuOpen && menuItems.length > 0) {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveMenuIndex(
                  Math.min(activeMenuIndex + 1, menuItems.length - 1),
                );
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveMenuIndex(Math.max(activeMenuIndex - 1, 0));
                return;
              }

              if (event.key === "Enter") {
                event.preventDefault();
                applyActiveMenuItem();
                return;
              }

            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="What are we building today?"
          disabled={isSending}
          role="combobox"
          aria-expanded={menuOpen}
          aria-controls="prompt-menu"
          aria-autocomplete="list"
          aria-activedescendant={
            menuOpen && menuItems[activeMenuIndex]
              ? `prompt-menu-item-${menuItems[activeMenuIndex].key}`
              : undefined
          }
          className="field-sizing-fixed max-h-50 min-h-7 resize-none overflow-y-auto border-0 bg-transparent px-1 py-1 leading-normal text-xs shadow-none focus-visible:ring-0"
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            const accepted = files.filter(
              (file) => file.size <= MAX_ATTACHMENT_SIZE,
            );
            const rejected = files.filter(
              (file) => file.size > MAX_ATTACHMENT_SIZE,
            );
            setAttachments((current) => [...current, ...accepted]);
            setAttachmentError(
              rejected.length > 0
                ? `${rejected.map((file) => file.name).join(", ")} exceed${rejected.length === 1 ? "s" : ""} the 25MB limit`
                : null,
            );
            event.target.value = "";
          }}
        />
        {attachmentError && (
          <p className="mt-2 text-xs text-destructive">{attachmentError}</p>
        )}
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex max-w-full items-center gap-2 rounded-md border bg-muted px-2 py-1 text-xs sm:max-w-48"
              >
                <HugeiconsIcon
                  icon={Attachment02Icon}
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground"
                />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setAttachments((current) =>
                      current.filter((_, fileIndex) => fileIndex !== index),
                    );
                  }}
                  disabled={isSending}
                  aria-label={`Remove ${file.name}`}
                >
                  <HugeiconsIcon
                    icon={Cancel02Icon}
                    size={13}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>
              </div>
            ))}
          </div>
        )}
        {isSending && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <HugeiconsIcon
              icon={Loading03Icon}
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className="animate-spin"
            />
            <span>Agent is working...</span>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                if (sourceOpen) {
                  setDismissed(true);
                  return;
                }
                openSourceMenu();
              }}
              disabled={isSending}
              aria-haspopup="listbox"
              aria-expanded={sourceOpen}
              aria-controls="prompt-menu"
              aria-label="Add photos, files, and sources"
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setModelOpen((open) => {
                    const next = !open;
                    if (next) {
                      setDismissed(true);
                      setActiveModelIndex(
                        models.findIndex(
                          (model) => model.key === selectedModel.key,
                        ),
                      );
                    }
                    return next;
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    if (!modelOpen) {
                      setModelOpen(true);
                      setDismissed(true);
                      setActiveModelIndex(
                        models.findIndex(
                          (model) => model.key === selectedModel.key,
                        ),
                      );
                      return;
                    }
                    setActiveModelIndex((index) =>
                      Math.min(index + 1, models.length - 1),
                    );
                    return;
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!modelOpen) return;
                    setActiveModelIndex((index) => Math.max(index - 1, 0));
                    return;
                  }
                  if (event.key === "Enter" || event.key === " ") {
                    if (!modelOpen) return;
                    event.preventDefault();
                    const model = models[activeModelIndex];
                    if (model) {
                      setSelectedModel(model);
                      setModelOpen(false);
                    }
                    return;
                  }
                  if (event.key === "Escape" && modelOpen) {
                    event.preventDefault();
                    setModelOpen(false);
                  }
                }}
                disabled={isSending}
                aria-haspopup="listbox"
                aria-expanded={modelOpen}
                aria-controls="model-menu"
                aria-label="Choose model"
              >
                <HugeiconsIcon
                  icon={Brain02Icon}
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {selectedModel.name}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Button>

              {modelOpen && (
                <div
                  id="model-menu"
                  role="listbox"
                  className="absolute top-full right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-lg"
                >
                  {models.map((model, index) => (
                    <button
                      key={model.key}
                      type="button"
                      role="option"
                      aria-selected={model.key === selectedModel.key}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left",
                        (model.key === selectedModel.key ||
                          index === activeModelIndex) &&
                          "bg-muted",
                      )}
                      onMouseEnter={() => setActiveModelIndex(index)}
                      onClick={() => {
                        setSelectedModel(model);
                        setModelOpen(false);
                      }}
                    >
                      <SourceIcon icon={model.icon} />
                      <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                        <span className="text-[11px] font-medium text-foreground">
                          {model.name}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {model.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant={listening ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setListening((current) => !current)}
              disabled={isSending}
              aria-label={listening ? "Stop dictation" : "Start dictation"}
              aria-pressed={listening}
              className="relative"
            >
              <HugeiconsIcon
                icon={AiMicIcon}
                size={15}
                strokeWidth={2}
                aria-hidden="true"
              />
              {listening && (
                <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-red-500">
                  <span className="absolute inset-0 animate-ping rounded-full bg-red-500" />
                </span>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isSending ? "secondary" : "default"}
              disabled={!isSending && !hasContent}
              onClick={handleSend}
              aria-label={isSending ? "Stop response" : "Send message"}
            >
              <HugeiconsIcon
                icon={isSending ? StopIcon : ArrowUp02Icon}
                size={15}
                strokeWidth={2}
                aria-hidden="true"
              />
              {isSending ? "Stop" : "Send"}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div
            id="prompt-menu"
            role="listbox"
            className="absolute top-full left-0 z-20 mt-2 w-full overflow-hidden rounded-2xl border bg-popover shadow-lg"
          >
            <div className="max-h-80 overflow-y-auto p-1.5">
              {menuItems.length > 0 ? (
                menuItems.map((item, index) => (
                  <div
                    key={item.key}
                    id={`prompt-menu-item-${item.key}`}
                    role="option"
                    aria-selected={index === activeMenuIndex}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5",
                      index === activeMenuIndex && "bg-muted",
                    )}
                    onMouseEnter={() => setActiveMenuIndex(index)}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={item.onSelect}
                    >
                      <SourceIcon icon={item.icon} />
                      <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                        <span className="text-[11px] font-medium text-foreground">
                          {item.name}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </button>
                    {item.isSource && (
                      <button
                        type="button"
                        disabled={item.connected}
                        onClick={() => toggleConnected(item.key)}
                        className={cn(
                          "shrink-0 text-[10px] font-medium",
                          item.connected
                            ? "text-muted-foreground"
                            : "text-primary hover:underline",
                        )}
                      >
                        {item.connected ? "Connected" : "Connect"}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-2.5 py-1.5 text-[10px] text-muted-foreground">
                  No results
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
