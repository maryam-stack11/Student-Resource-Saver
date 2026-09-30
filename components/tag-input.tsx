"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { LIMITS } from "@/lib/constants";
import { cleanName } from "@/lib/validation";
import { CloseIcon } from "@/components/icons";

/**
 * Tag picker: type a tag and press Enter (or comma) to add it.
 * Tags you have used before are offered as one-click suggestions.
 */
export function TagInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) {
  const [text, setText] = useState("");
  const inputId = useId();
  const hintId = useId();

  const chosen = new Set(value.map((tag) => tag.toLowerCase()));
  const isFull = value.length >= LIMITS.tagsPerResource;
  const typed = text.trim().toLowerCase();
  const matching = suggestions
    .filter((tag) => !chosen.has(tag.toLowerCase()))
    .filter((tag) => !typed || tag.toLowerCase().includes(typed))
    .slice(0, 8);

  function add(raw: string) {
    const name = cleanName(raw.replace(/^#+/, "")).slice(0, LIMITS.tagName);
    setText("");
    if (!name || isFull || chosen.has(name.toLowerCase())) return;
    // Reuse the spelling of an existing tag ("oop" → "OOP").
    const existing = suggestions.find((tag) => tag.toLowerCase() === name.toLowerCase());
    onChange([...value, existing ?? name]);
  }

  function remove(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      // Enter must add the tag, not submit the whole form.
      event.preventDefault();
      add(text);
    } else if (event.key === "Backspace" && !text && value.length > 0) {
      remove(value[value.length - 1]);
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="field-label">
        Tags
      </label>
      <div className="field flex flex-wrap items-center gap-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-500">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pr-1 pl-2.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="cursor-pointer rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800"
              aria-label={`Remove tag ${tag}`}
            >
              <CloseIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(text)}
          disabled={isFull}
          maxLength={LIMITS.tagName}
          aria-describedby={hintId}
          placeholder={isFull ? "Tag limit reached" : value.length ? "Add another…" : "e.g. OOP, Exam"}
          className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          autoComplete="off"
        />
      </div>
      <p id={hintId} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Press Enter or comma to add a tag. Up to {LIMITS.tagsPerResource} tags.
      </p>
      {matching.length > 0 && !isFull ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">Your tags:</span>
          {matching.map((tag) => (
            <button
              key={tag}
              type="button"
              // onMouseDown keeps the text box from losing focus (which would add half-typed text).
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => add(tag)}
              className="cursor-pointer rounded-full border border-slate-300 px-2.5 py-0.5 text-xs text-slate-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
            >
              + {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
