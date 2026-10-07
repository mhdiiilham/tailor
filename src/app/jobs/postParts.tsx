"use client";

import { BookmarkSimple, Check, Link as LinkIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setHnPostSaved } from "@/app/actions";
import { Badge } from "@/components/ui";
import { hnPostPath } from "@/domain/hn";
import { splitLinks } from "@/domain/linkify";

// Pieces shared by the post list and the single-post page.

// The post as written on HN: its paragraphs, with every web link clickable. The text
// is plain (converted when it was fetched), so nothing in it is rendered as HTML.
export function OriginalPost({ text, scroll = true }: { text: string; scroll?: boolean }) {
  return (
    <div
      className={`grid gap-3 text-sm leading-relaxed text-ink ${scroll ? "max-h-[560px] overflow-y-auto pr-1" : ""}`}
    >
      {text.split(/\n{2,}/).map((paragraph, i) => (
        <p key={i} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
          {splitLinks(paragraph).map((part, j) =>
            part.href ? (
              <a
                key={j}
                href={part.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent underline decoration-accent/40 hover:decoration-accent"
              >
                {part.text}
              </a>
            ) : (
              part.text
            ),
          )}
        </p>
      ))}
    </div>
  );
}

// Saves the post to the user's list (or removes it), right away, undoing on failure.
export function SaveButton({ postId, initial }: { postId: number; initial: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await setHnPostSaved(postId, next);
      if (result.error) {
        setSaved(!next);
        alert(result.error);
      } else {
        router.refresh(); // updates the Saved count
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={`inline-flex h-8 items-center gap-1.5 rounded-ui px-2 text-xs transition-colors disabled:opacity-60 ${
        saved ? "text-accent" : "text-muted hover:text-ink"
      }`}
    >
      <BookmarkSimple size={14} weight={saved ? "fill" : "regular"} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}

// A badge that never gets wider than the card: Gemini sometimes copies a whole sentence
// into a field (a salary note, a long location), and badges don't wrap. Anything too
// long is cut with "…"; the full text shows on hover.
export function FitBadge({ mono = false, children }: { mono?: boolean; children: string }) {
  return (
    <span className="flex min-w-0 max-w-full sm:max-w-80">
      <Badge mono={mono} truncate>
        {children}
      </Badge>
    </span>
  );
}

// Copies the link to a post's page, so it can be sent to someone.
export function CopyLinkButton({ postId }: { postId: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${hnPostPath(postId)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the post's title is also a link to copy by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-8 items-center gap-1.5 rounded-ui px-2 text-xs text-muted transition-colors hover:text-ink"
    >
      {copied ? <Check size={14} weight="bold" className="text-good" /> : <LinkIcon size={14} />}
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
