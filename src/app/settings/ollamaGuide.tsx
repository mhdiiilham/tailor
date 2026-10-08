"use client";

import { BookOpen, Check, Copy, X } from "@phosphor-icons/react";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { RECOMMENDED_MODELS } from "@/infrastructure/llm/ollamaConfig";

// Explains the one-time Ollama setup. It uses the native <dialog>, like "Track a job".
export function OllamaGuide() {
  const dialog = useRef<HTMLDialogElement>(null);
  // The address Ollama must allow: this site, as the browser sees it.
  const [origin, setOrigin] = useState("");

  function open() {
    setOrigin(window.location.origin);
    dialog.current?.showModal();
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={open}>
        <BookOpen size={16} />
        Setup guide
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="ollama-guide-title"
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="m-auto w-[min(680px,calc(100%-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-card border border-line bg-raised p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="grid gap-6 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <h2 id="ollama-guide-title" className="text-lg font-medium">
                Set up Ollama
              </h2>
              <p className="text-sm text-muted">
                Tailor runs in your browser and calls Ollama on this computer, so Ollama has to allow this site once.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="grid size-8 shrink-0 place-items-center rounded-ui text-faint hover:bg-sunken hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>

          <Step n={1} title="Install Ollama">
            <p>
              Download it from{" "}
              <a href="https://ollama.com/download" target="_blank" rel="noreferrer" className="text-accent underline">
                ollama.com/download
              </a>{" "}
              and start it.
            </p>
          </Step>

          <Step n={2} title="Allow this site (OLLAMA_ORIGINS)">
            <p>
              Set <code className="font-mono">OLLAMA_ORIGINS</code> to <code className="font-mono">{origin}</code>, then
              restart Ollama. Pick your setup:
            </p>
            <Command label="Mac app" command={`launchctl setenv OLLAMA_ORIGINS "${origin}"`} />
            <Command label="Terminal (Mac or Linux)" command={`OLLAMA_ORIGINS="${origin}" ollama serve`} />
            <Command
              label="Linux service: run `systemctl edit ollama`, add this, then `systemctl restart ollama`"
              command={`[Service]\nEnvironment="OLLAMA_ORIGINS=${origin}"`}
            />
            <p className="text-faint">
              Windows: add a user environment variable named <code className="font-mono">OLLAMA_ORIGINS</code> with
              that value, then quit and reopen Ollama.
            </p>
          </Step>

          <Step n={3} title="Pick a model">
            <p>
              Run <code className="font-mono">ollama pull &lt;name&gt;</code> for a local model, type the name in the
              fields on this page, then press Test connection. Models under about 7B often break the JSON this app
              needs.
            </p>
            <div className="overflow-x-auto rounded-ui border border-line">
              <table className="w-full text-left text-sm">
                <tbody>
                  {RECOMMENDED_MODELS.map((m) => (
                    <tr key={m.name} className="border-b border-line last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 font-mono">{m.name}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted">{m.where}</td>
                      <td className="px-3 py-2 text-faint">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Step>

          <Step n={4} title="Optional: cloud models">
            <p>
              Sign in once and models ending in <code className="font-mono">-cloud</code> run on Ollama&apos;s servers
              instead of your computer. Tailor still only talks to localhost, and your account stays in Ollama.
            </p>
            <Command label="Sign in" command="ollama signin" />
          </Step>
        </div>
      </dialog>
    </>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2 text-sm">
      <h3 className="font-medium">
        {n}. {title}
      </h3>
      {children}
    </section>
  );
}

function Command({ label, command }: { label: string; command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-1">
      <span className="text-xs text-faint">{label}</span>
      <div className="flex items-start gap-2 rounded-ui border border-line bg-sunken p-2">
        <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-xs">{command}</pre>
        <button
          type="button"
          aria-label="Copy command"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(command);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              // Clipboard blocked; the command can still be selected by hand.
            }
          }}
          className="grid size-7 shrink-0 place-items-center rounded-ui text-faint hover:text-ink"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
