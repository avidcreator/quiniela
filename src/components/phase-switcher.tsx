"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  publishPhaseAction,
  selectPreviewPhaseAction,
} from "./phase-switcher-actions";

type Phase = "phase_one" | "phase_two";

const LABELS: Record<Phase, string> = {
  phase_one: "Fase 1",
  phase_two: "Fase 2",
};

const SUBLABELS: Record<Phase, string> = {
  phase_one: "Fase de grupos",
  phase_two: "Eliminatorias",
};

const PHASES: Phase[] = ["phase_one", "phase_two"];

/**
 * Admin-only phase selector (left of the dark-mode toggle).
 *
 * `current` is the phase this admin is previewing; `published` is what the
 * public sees. Switching only changes the admin's own view (a cookie). When the
 * previewed phase isn't the published one, a "Publicar" action makes it public.
 *
 * The actions are invoked through `useTransition` (not a form `action`) so that
 * closing the dropdown doesn't unmount a mid-flight submission.
 */
export function PhaseSwitcher({
  current,
  published,
}: {
  current: Phase;
  published: Phase;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const isPreviewing = current !== published;

  function selectPhase(phase: Phase) {
    setOpen(false);
    if (phase === current) return;
    startTransition(async () => {
      await selectPreviewPhaseAction(phase);
      router.refresh();
    });
  }

  function publish() {
    setOpen(false);
    startTransition(async () => {
      await publishPhaseAction(current);
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1.5"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="font-medium">{LABELS[current]}</span>
        {isPreviewing ? (
          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Vista previa
          </span>
        ) : null}
        <ChevronDown className="size-4 opacity-60" />
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg">
          {PHASES.map((phase) => (
            <button
              key={phase}
              type="button"
              onClick={() => selectPhase(phase)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
            >
              <span>
                <span className="font-medium">{LABELS[phase]}</span>
                <span className="block text-xs text-muted-foreground">
                  {SUBLABELS[phase]}
                </span>
              </span>
              {phase === current ? (
                <Check className="size-4 text-primary" />
              ) : null}
            </button>
          ))}

          <div className="my-1 border-t" />
          <div className="px-3 py-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Globe className="size-3" />
              Pública: <span className="font-medium">{LABELS[published]}</span>
            </span>
          </div>

          {isPreviewing ? (
            <div className="p-1">
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={publish}
                disabled={pending}
              >
                Publicar {LABELS[current]}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
