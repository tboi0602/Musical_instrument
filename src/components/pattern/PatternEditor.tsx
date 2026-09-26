"use client";
import { useState, useSyncExternalStore } from "react";
import { Grid2X2, RotateCcw, Save, Play, Trash2 } from "lucide-react";
import { useStudio } from "../../store/studio";
import { audioEngine } from "../../audio/core/AudioEngine";
import {
  adaptPattern,
  GUITAR_ACTIONS,
  PIANO_ACTIONS,
  validatePattern,
} from "../../audio/rhythm/PatternEngine";
import { PATTERNS, actionLabel } from "../../audio/rhythm/patterns";
import { degreeChord } from "../../musicTheory/chords";
import { playChord } from "../keyboard/ChordKeyboard";
import type { Technique } from "../../types/music";
export function PatternEditor() {
  const s = useStudio((x) => x.settings),
    pattern = useStudio((x) => x.pattern),
    customs = useStudio((x) => x.customs);
  const [name, setName] = useState("My acoustic pattern");
  const [advanced, setAdvanced] = useState(false);
  const t = useSyncExternalStore(
    audioEngine.subscribe,
    audioEngine.getSnapshot,
    audioEngine.getServerSnapshot,
  );
  const actions = s.instrument === "guitar" ? GUITAR_ACTIONS : PIANO_ACTIONS;
  const rows = advanced
    ? actions.filter((a) => a !== "REST")
    : s.instrument === "guitar"
      ? ([
          "DOWN",
          "UP",
          "BASS",
          "PICK_3",
          "PICK_2",
          "PICK_1",
          "MUTE",
        ] as Technique[])
      : (["BLOCK", "ROOT", "THIRD", "FIFTH", "TOP", "OCTAVE"] as Technique[]);
  function toggle(index: number, action: Technique) {
    const steps = structuredClone(pattern.steps);
    const existing: Technique[] = steps[index].actions.filter(
      (a) => a !== "REST",
    );
    steps[index].actions = existing.includes(action)
      ? existing.filter((a) => a !== action)
      : [...existing, action];
    if (!steps[index].actions.length) steps[index].actions = ["REST"];
    useStudio.getState().editPattern({ ...pattern, steps });
  }
  const error = validatePattern(pattern);
  return (
    <section className="panel pattern-panel">
      <div className="section-heading">
        <div>
          <Grid2X2 size={17} />
          <h2>Rhythm lab</h2>
          <span className="tag">{pattern.custom ? "CUSTOM" : "PATTERN"}</span>
        </div>
        <button
          className="text-button"
          onClick={() => {
            if (t.playing) audioEngine.stop();
            else
              playChord(t.current ?? degreeChord(s.key, s.scale, 0, s.octave));
          }}
        >
          <Play size={13} />
          {t.playing ? "Stop preview" : "Preview"}
        </button>
      </div>
      <div className="pattern-toolbar">
        <label className="pattern-select">
          <span className="sr-only">Pattern preset</span>
          <select
            aria-label="Pattern preset"
            value={pattern.id}
            onChange={(e) => useStudio.getState().selectPattern(e.target.value)}
          >
            {[...PATTERNS, ...customs]
              .filter((p) => p.instrument === s.instrument)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.custom ? " · saved" : ""}
                </option>
              ))}
          </select>
        </label>
        <span className="muted">
          {pattern.signature} · {pattern.steps.length} steps
        </span>
        <label className="subdivision">
          Grid{" "}
          <select
            aria-label="Subdivision"
            value={pattern.stepsPerBeat}
            onChange={(e) =>
              useStudio
                .getState()
                .editPattern(
                  adaptPattern(
                    pattern,
                    pattern.signature,
                    Number(e.target.value),
                  ),
                )
            }
          >
            <option value="1">1× beat</option>
            <option value="2">2× beat</option>
            <option value="4">4× beat</option>
          </select>
        </label>
      </div>
      {error ? (
        <p role="alert" className="error-message">
          {error}
        </p>
      ) : (
        <div className="sequencer-scroll">
          <div
            className="sequencer"
            style={{
              gridTemplateColumns: `94px repeat(${pattern.steps.length}, minmax(28px, 1fr))`,
            }}
          >
            <span className="grid-label">TECHNIQUE</span>
            {pattern.steps.map((_, i) => (
              <span
                key={i}
                className={`grid-time ${t.playing && t.step === i ? "current" : ""}`}
              >
                {i % pattern.stepsPerBeat === 0
                  ? Math.floor(i / pattern.stepsPerBeat) + 1
                  : pattern.stepsPerBeat === 4
                    ? ["", "e", "&", "a"][i % 4]
                    : "&"}
              </span>
            ))}
            {rows.map((action) => (
              <GridRow
                key={action}
                action={action}
                length={pattern.steps.length}
                current={t.playing ? t.step : -1}
                selected={pattern.steps.map((step) =>
                  step.actions.includes(action),
                )}
                onToggle={(i) => toggle(i, action)}
              />
            ))}
            <span className="grid-label">VELOCITY</span>
            {pattern.steps.map((step, i) => (
              <input
                className="step-velocity"
                key={i}
                aria-label={`Step ${i + 1} velocity`}
                type="range"
                min="0"
                max="1"
                step=".05"
                value={step.velocity}
                onChange={(e) => {
                  const steps = structuredClone(pattern.steps);
                  steps[i].velocity = Number(e.target.value);
                  useStudio.getState().editPattern({ ...pattern, steps });
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div className="pattern-foot">
        <button className="text-button" onClick={() => setAdvanced(!advanced)}>
          {advanced ? "Fewer techniques" : "All techniques +"}{" "}
        </button>
        <span className="muted">Click a cell to add or remove a hit.</span>
        <button
          className="icon-button"
          aria-label="Reset pattern"
          onClick={() => {
            const original = [...PATTERNS, ...customs].find(
              (p) => p.id === pattern.id,
            )!;
            useStudio
              .getState()
              .editPattern(adaptPattern(original, s.signature));
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="save-pattern">
        <input
          aria-label="Custom pattern name"
          value={name}
          maxLength={48}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="secondary-button"
          onClick={() => useStudio.getState().savePattern(name)}
        >
          <Save size={14} />
          Save pattern
        </button>
        {pattern.custom && (
          <button
            className="icon-button"
            aria-label="Delete saved pattern"
            onClick={() => useStudio.getState().deletePattern(pattern.id)}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </section>
  );
}
function GridRow({
  action,
  length,
  current,
  selected,
  onToggle,
}: {
  action: Technique;
  length: number;
  current: number;
  selected: boolean[];
  onToggle: (index: number) => void;
}) {
  return (
    <>
      <span className="row-label">
        <b>{actionLabel(action)}</b>
        {action.replace("PICK_", "String ").replaceAll("_", " ").toLowerCase()}
      </span>
      {Array.from({ length }, (_, i) => (
        <button
          key={i}
          aria-label={`${action} step ${i + 1}`}
          aria-pressed={selected[i]}
          className={`grid-cell ${selected[i] ? "on" : ""} ${current === i ? "playhead" : ""}`}
          onClick={() => onToggle(i)}
        >
          {selected[i] && <span />}
        </button>
      ))}
    </>
  );
}
