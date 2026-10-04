"use client";

import {
  ArrowsOutLineHorizontal,
  ArrowSquareOut,
  DownloadSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button, ButtonAnchor, Skeleton } from "@/components/ui";

const ZOOM_STEPS = [60, 80, 100, 125, 150, 200];

// The resume as page images rendered by Typst, so it looks the same in every
// browser. The real PDF is one click away for opening or downloading.
export function ResumeViewer({ id, pages, version }: { id: number; pages: number; version: string }) {
  const [zoom, setZoom] = useState(100);
  const step = (dir: 1 | -1) => {
    const i = ZOOM_STEPS.indexOf(zoom) + dir;
    if (i >= 0 && i < ZOOM_STEPS.length) setZoom(ZOOM_STEPS[i]);
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-ui border border-line bg-sunken px-2 py-1.5">
        <span className="px-1.5 font-mono text-xs text-faint">
          {pages} {pages === 1 ? "page" : "pages"}
        </span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" onClick={() => step(-1)} disabled={zoom === ZOOM_STEPS[0]} title="Zoom out">
            <MagnifyingGlassMinus size={16} />
            <span className="sr-only">Zoom out</span>
          </Button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            title="Fit width"
            className="inline-flex min-w-14 items-center justify-center gap-1 rounded-ui px-1.5 py-1 font-mono text-xs text-muted hover:bg-raised hover:text-ink"
          >
            {zoom === 100 ? <ArrowsOutLineHorizontal size={14} /> : null}
            {zoom}%
          </button>
          <Button
            variant="ghost"
            onClick={() => step(1)}
            disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            title="Zoom in"
          >
            <MagnifyingGlassPlus size={16} />
            <span className="sr-only">Zoom in</span>
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <ButtonAnchor variant="secondary" size="sm" href={`/applications/${id}/pdf`} target="_blank">
            <ArrowSquareOut size={14} />
            Open
          </ButtonAnchor>
          <ButtonAnchor variant="secondary" size="sm" href={`/applications/${id}/pdf?download=pdf`}>
            <DownloadSimple size={14} />
            PDF
          </ButtonAnchor>
        </div>
      </div>

      <div className="max-h-[80dvh] overflow-auto rounded-ui border border-line bg-sunken p-3">
        <div className="mx-auto grid gap-3" style={{ width: `${zoom}%` }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
            <div
              key={`${version}-${page}`}
              className="relative aspect-[8.5/11] overflow-hidden rounded-sm bg-white shadow-sm"
            >
              {/* Sits behind the image: visible until the page loads, then covered by it. */}
              <Skeleton className="absolute inset-0 rounded-none" />
              {/* Plain img: these are private, per-user PNGs that next/image shouldn't proxy or cache. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/applications/${id}/preview/${page}?v=${version}`}
                alt={`Resume page ${page} of ${pages}`}
                className="relative block size-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
