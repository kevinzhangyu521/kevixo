"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import {
  buildManualHandModel,
  buildPastedHandModel,
  buildScreenshotHandModel,
  importProviderConfigs,
  saveImportedHandModel,
  type ImportMethodId,
  type SeatPosition,
  type UnifiedHandModel,
} from "@/lib/hand-import";

const heroPositions: SeatPosition[] = ["SB", "BB", "UTG", "HJ", "CO", "BTN", "Unknown"];

const defaultHandHistory = `Hand History
Hero opens CO with As Qs
Button calls
Flop Qh 8s 4d
Hero bets 1.5
Button calls
Turn 9s
Hero bets 4.5
Button calls
River 2c
Hero checks
Button bets 16
Hero calls`;

export default function ImportHandPage() {
  const [activeMethod, setActiveMethod] = useState<ImportMethodId>("screenshot");
  const [screenshotName, setScreenshotName] = useState("");
  const [pastedHand, setPastedHand] = useState(defaultHandHistory);
  const [manualInput, setManualInput] = useState({
    heroPosition: "CO" as SeatPosition,
    heroCards: "As Qs",
    flop: "Qh 8s 4d",
    turn: "9s",
    river: "2c",
    keyAction: "Hero checks, Villain bets large, Hero calls.",
  });

  const unifiedHand = useMemo<UnifiedHandModel>(() => {
    if (activeMethod === "paste") {
      return buildPastedHandModel(pastedHand);
    }

    if (activeMethod === "manual") {
      return buildManualHandModel(manualInput);
    }

    return buildScreenshotHandModel(screenshotName);
  }, [activeMethod, manualInput, pastedHand, screenshotName]);

  function handleScreenshotChange(event: ChangeEvent<HTMLInputElement>) {
    setScreenshotName(event.target.files?.[0]?.name ?? "");
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Review" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Universal Import
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              Import Hand
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400 md:text-lg md:leading-8">
              Bring a hand in from a screenshot, text history, or manual builder. Every path
              becomes the same internal hand model before Kevixo analyzes decisions.
            </p>
          </div>
          <Card className="border-primary/20 bg-slate-950/58 p-5">
            <CardTitle>Architecture</CardTitle>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-300">
              <ArchitectureStep label="Import Adapter" value={activeMethod} />
              <ArchitectureStep label="Unified Model" value="KevixoHandModel" />
              <ArchitectureStep label="Analysis Layer" value="Provider-agnostic coaching" />
            </div>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-0">
            <div className="border-b border-slate-800 p-3">
              <div
                className="grid gap-2 md:grid-cols-3"
                role="tablist"
                aria-label="Hand import methods"
              >
                {importProviderConfigs.map((provider) => {
                  const isActive = activeMethod === provider.id;

                  return (
                    <button
                      key={provider.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveMethod(provider.id)}
                      className={[
                        "rounded-xl border px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5",
                        isActive
                          ? "border-primary/55 bg-primary/10 shadow-[0_0_28px_rgba(59,201,255,0.14)]"
                          : "border-slate-800 bg-slate-950/42 hover:border-primary/30",
                      ].join(" ")}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-50">
                          {provider.shortLabel}
                        </span>
                        {provider.badge ? (
                          <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            {provider.badge}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-slate-500">
                        {provider.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 md:p-6">
              {activeMethod === "screenshot" ? (
                <ScreenshotImporter
                  fileName={screenshotName}
                  model={unifiedHand}
                  onChange={handleScreenshotChange}
                />
              ) : null}
              {activeMethod === "paste" ? (
                <PasteImporter model={unifiedHand} value={pastedHand} onChange={setPastedHand} />
              ) : null}
              {activeMethod === "manual" ? (
                <ManualImporter
                  model={unifiedHand}
                  value={manualInput}
                  onChange={setManualInput}
                />
              ) : null}
            </div>
          </Card>

          <ModelPreview model={unifiedHand} />
        </div>
      </section>
    </main>
  );
}

function ScreenshotImporter({
  fileName,
  model,
  onChange,
}: {
  fileName: string;
  model: UnifiedHandModel;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <CardTitle>Upload Screenshot</CardTitle>
      <label className="mt-5 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/35 bg-primary/5 px-6 text-center transition hover:border-primary/65 hover:bg-primary/10">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onChange}
          className="sr-only"
        />
        <span className="text-base font-semibold text-slate-50">
          {fileName || "Drop a hand screenshot here"}
        </span>
        <span className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          Screenshot is the recommended flow because players often have visual hand summaries
          before they have text exports. OCR can plug into this adapter later.
        </span>
      </label>
      <ImportActions model={model} />
    </div>
  );
}

function PasteImporter({
  model,
  value,
  onChange,
}: {
  model: UnifiedHandModel;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <CardTitle>Paste Hand History</CardTitle>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-5 min-h-80"
        placeholder="Paste any exported hand text here..."
      />
      <ImportActions model={model} />
    </div>
  );
}

function ManualImporter({
  model,
  value,
  onChange,
}: {
  model: UnifiedHandModel;
  value: {
    heroPosition: SeatPosition;
    heroCards: string;
    flop: string;
    turn: string;
    river: string;
    keyAction: string;
  };
  onChange: (value: {
    heroPosition: SeatPosition;
    heroCards: string;
    flop: string;
    turn: string;
    river: string;
    keyAction: string;
  }) => void;
}) {
  return (
    <div>
      <CardTitle>Manual Hand Builder</CardTitle>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-200">
          Hero position
          <select
            value={value.heroPosition}
            onChange={(event) =>
              onChange({ ...value, heroPosition: event.target.value as SeatPosition })
            }
            className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100"
          >
            {heroPositions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>
        <ImportInput
          label="Hero cards"
          value={value.heroCards}
          placeholder="As Qs"
          onChange={(heroCards) => onChange({ ...value, heroCards })}
        />
        <ImportInput
          label="Flop"
          value={value.flop}
          placeholder="Qh 8s 4d"
          onChange={(flop) => onChange({ ...value, flop })}
        />
        <ImportInput
          label="Turn"
          value={value.turn}
          placeholder="9s"
          onChange={(turn) => onChange({ ...value, turn })}
        />
        <ImportInput
          label="River"
          value={value.river}
          placeholder="2c"
          onChange={(river) => onChange({ ...value, river })}
        />
      </div>
      <label className="mt-4 grid gap-2 text-sm font-medium text-slate-200">
        Key action
        <Textarea
          value={value.keyAction}
          onChange={(event) => onChange({ ...value, keyAction: event.target.value })}
          className="min-h-32 text-sm leading-6"
          placeholder="Describe the decision point..."
        />
      </label>
      <ImportActions model={model} />
    </div>
  );
}

function ImportInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-200">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100 placeholder:text-slate-600"
      />
    </label>
  );
}

function ImportActions({ model }: { model: UnifiedHandModel }) {
  function handleContinue() {
    saveImportedHandModel(window.localStorage, model);
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button asChild className="min-w-40 shadow-[0_0_28px_rgba(59,201,255,0.18)]">
        <Link href="/review" onClick={handleContinue}>
          Continue to Review
        </Link>
      </Button>
      <p className="text-sm leading-6 text-slate-500">
        Analysis receives the normalized model, not provider-specific input.
      </p>
    </div>
  );
}

function ModelPreview({ model }: { model: UnifiedHandModel }) {
  return (
    <Card className="border-primary/20 bg-slate-950/58 p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Unified Hand Model</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            All import methods convert into this shape before analysis.
          </p>
        </div>
        <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {model.source.confidence}% confidence
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <PreviewStat label="Source" value={model.source.method} />
        <PreviewStat label="Game" value={model.game.variant} />
        <PreviewStat label="Hero" value={model.hero.position} />
        <PreviewStat label="Cards" value={model.hero.cards.join(" ") || "Pending"} />
        <PreviewStat label="Board" value={formatBoard(model)} />
        <PreviewStat label="Actions" value={`${model.actions.length} parsed`} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/48 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Import Notes
        </p>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
          {model.importNotes.map((note) => (
            <li key={note} className="flex gap-2">
              <span className="text-primary">-</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/48 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Recent Actions
        </p>
        <div className="mt-3 grid gap-2">
          {model.actions.slice(0, 4).map((action, index) => (
            <p key={`${action.raw}-${index}`} className="text-sm leading-6 text-slate-300">
              <span className="text-primary">{action.round}</span> {action.raw ?? action.action}
            </p>
          ))}
          {model.actions.length === 0 ? (
            <p className="text-sm leading-6 text-slate-500">No actions parsed yet.</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function ArchitectureStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/48 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/48 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{value}</p>
    </div>
  );
}

function formatBoard(model: UnifiedHandModel) {
  const cards = [...model.board.flop, model.board.turn, model.board.river].filter(Boolean);

  return cards.join(" ") || "Pending";
}
