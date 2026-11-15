"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EditorState } from "@/lib/cms/content";
import type { Field, SectionDef } from "@/lib/cms/sections";
import { adminFetch } from "./adminFetch";
import { dangerButton, inputClass, primaryButton, quietButton, useToast } from "./Toast";

/**
 * One editor for every website section. It is drawn entirely from the
 * section's description in src/lib/cms/sections.ts, so adding a field there
 * adds it here.
 *
 *   Save draft        keeps your work, the website does not change
 *   Publish           makes it live on the website
 *   Restore original  throws away every edit to this section
 */

type Value = Record<string, any>;

export default function CmsEditor({
  def,
  initial,
  canEdit,
  canPublish,
}: {
  def: SectionDef;
  initial: EditorState;
  canEdit: boolean;
  canPublish: boolean;
}) {
  const [state, setState] = useState(initial);
  const [value, setValue] = useState<Value>(initial.value);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "publish" | "restore">(null);
  const toast = useToast();
  const api = `/api/admin/cms/content/${def.key}`;

  // Warn before closing the tab with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (name: string, v: unknown) => {
    setValue((old) => ({ ...old, [name]: v }));
    setDirty(true);
  };

  const apply = (next: EditorState) => {
    setState(next);
    setValue(next.value);
    setDirty(false);
  };

  async function saveDraft() {
    setBusy("save");
    const res = await adminFetch<EditorState>(api, { method: "PUT", json: { data: value } });
    setBusy(null);
    if (!res.ok) return toast.show(res.error, "error");
    apply(res.data);
    toast.show("Draft saved. The website has not changed yet.");
  }

  async function publish() {
    setBusy("publish");
    const res = await adminFetch<EditorState>(api, { method: "POST", json: { action: "publish", data: value } });
    setBusy(null);
    if (!res.ok) return toast.show(res.error, "error");
    apply(res.data);
    toast.show("Published. It can take up to 20 seconds to show on the website.");
  }

  async function restore() {
    if (!window.confirm(`Restore “${def.title}” to the original?\n\nEvery edit to this section will be removed and the website will show the original content again. This cannot be undone.`)) return;
    setBusy("restore");
    const res = await adminFetch<EditorState>(api, { method: "POST", json: { action: "restore" } });
    setBusy(null);
    if (!res.ok) return toast.show(res.error, "error");
    apply(res.data);
    toast.show("Restored to the original content.");
  }

  // Fields are grouped into cards at each "heading".
  const groups = useMemo(() => {
    const out: { label?: string; hint?: string; fields: Field[] }[] = [];
    for (const f of def.fields) {
      if (f.type === "heading") out.push({ label: f.label, hint: f.hint, fields: [] });
      else {
        if (!out.length) out.push({ fields: [] });
        out[out.length - 1].fields.push(f);
      }
    }
    return out;
  }, [def]);

  const status = dirty
    ? { text: "Unsaved changes", tone: "bg-warn-soft text-warn" }
    : state.hasDraft
    ? { text: "Draft saved — not on the website yet", tone: "bg-info-soft text-info" }
    : state.isPublished
    ? { text: `Live — published ${formatWhen(state.publishedAt)}`, tone: "bg-ok-soft text-ok" }
    : { text: "Showing the original content", tone: "bg-surface-2 text-fg-muted" };

  return (
    <div className="space-y-4 pb-28">
      {groups.map((g, i) => (
        <section key={i} className="card-shadow rounded-2xl border border-line bg-surface">
          {g.label && (
            <header className="border-b border-line px-4 py-3">
              <h2 className="text-[15px] font-semibold text-fg">{g.label}</h2>
              {g.hint && <p className="mt-0.5 text-[12.5px] text-fg-subtle">{g.hint}</p>}
            </header>
          )}
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            {g.fields.map((f) =>
              f.type === "heading" ? null : (
                <div key={f.name} className={wide(f) ? "sm:col-span-2" : ""}>
                  <FieldInput field={f} value={value[f.name]} onChange={(v) => set(f.name, v)} disabled={!canEdit} onError={(m) => toast.show(m, "error")} />
                </div>
              )
            )}
          </div>
        </section>
      ))}

      {/* Action bar — always in reach, including on a phone. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:left-56">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <span className={`mr-auto rounded-full px-2.5 py-1 text-[12px] font-medium ${status.tone}`}>{status.text}</span>
          {canPublish && (state.isPublished || state.hasDraft) && (
            <button type="button" onClick={restore} disabled={!!busy} className={dangerButton}>
              {busy === "restore" ? "Restoring…" : "Restore original"}
            </button>
          )}
          {canEdit && (
            <button type="button" onClick={saveDraft} disabled={!!busy || !dirty} className={quietButton}>
              {busy === "save" ? "Saving…" : "Save draft"}
            </button>
          )}
          {canPublish && (
            <button type="button" onClick={publish} disabled={!!busy || (!dirty && !state.hasDraft)} className={primaryButton}>
              {busy === "publish" ? "Publishing…" : "Publish"}
            </button>
          )}
          {!canEdit && <span className="text-[13px] text-fg-subtle">Your role can view this but not change it.</span>}
        </div>
      </div>
      {toast.node}
    </div>
  );
}

const wide = (f: Field) => f.type === "textarea" || f.type === "list" || f.type === "lines" || f.type === "image" || f.type === "toggle";

function formatWhen(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function Label({ field, children }: { field: { label: string; hint?: string }; children: React.ReactNode }) {
  return (
    <label className="block text-[13px] font-medium text-fg">
      {field.label}
      {children}
      {field.hint && <span className="mt-1 block text-[12px] font-normal text-fg-subtle">{field.hint}</span>}
    </label>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  disabled,
  onError,
}: {
  field: Exclude<Field, { type: "heading" }>;
  value: any;
  onChange: (v: any) => void;
  disabled: boolean;
  onError: (message: string) => void;
}) {
  switch (field.type) {
    case "text":
      return (
        <Label field={field}>
          <input className={inputClass} value={value ?? ""} maxLength={field.max ?? 200} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        </Label>
      );
    case "textarea":
      return (
        <Label field={field}>
          <textarea className={inputClass} rows={4} value={value ?? ""} maxLength={field.max ?? 1000} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        </Label>
      );
    case "link":
      return (
        <Label field={{ ...field, hint: field.hint ?? "A page on this site (/pricing) or a full link (https://…)." }}>
          <input className={inputClass} value={value ?? ""} maxLength={500} disabled={disabled} placeholder="/pricing" inputMode="url" onChange={(e) => onChange(e.target.value)} />
        </Label>
      );
    case "date":
      return (
        <Label field={field}>
          <input type="date" className={inputClass} value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        </Label>
      );
    case "number":
      return (
        <Label field={field}>
          <input type="number" min={0} max={600} className={inputClass} value={value ?? "0"} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        </Label>
      );
    case "select":
      return (
        <Label field={field}>
          <select className={inputClass} value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Label>
      );
    case "toggle":
      return (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2 p-3">
          <input type="checkbox" className="mt-0.5 h-5 w-5" checked={value === true} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
          <span>
            <span className="block text-[14px] font-medium text-fg">{field.label}</span>
            {field.hint && <span className="mt-0.5 block text-[12px] text-fg-subtle">{field.hint}</span>}
          </span>
        </label>
      );
    case "lines":
      return <LinesInput field={field} value={Array.isArray(value) ? value : []} onChange={onChange} disabled={disabled} />;
    case "image":
      return <ImageInput field={field} value={value ?? ""} onChange={onChange} disabled={disabled} onError={onError} />;
    case "list":
      return <ListInput field={field} value={Array.isArray(value) ? value : []} onChange={onChange} disabled={disabled} onError={onError} />;
  }
}

/** A list of short lines, edited as one box with one entry per line. */
function LinesInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: { label: string; hint?: string };
  value: string[];
  onChange: (v: string[]) => void;
  disabled: boolean;
}) {
  // Kept as raw text while typing so an empty line doesn't vanish mid-edit.
  const [text, setText] = useState(value.join("\n"));
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value && value.join("\n") !== text.split("\n").map((l) => l.trim()).filter(Boolean).join("\n")) {
      setText(value.join("\n"));
    }
    last.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <Label field={field}>
      <textarea
        className={inputClass}
        rows={Math.min(12, Math.max(3, text.split("\n").length + 1))}
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean));
        }}
      />
    </Label>
  );
}

/** Shrinks a picture in the browser (max 1600px, compressed) before it is uploaded. */
async function shrinkImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("unreadable"));
      el.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    // PNGs may be transparent, so they become WebP; photos become JPEG.
    const want = file.type === "image/png" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, want, 0.82));
    if (!blob) throw new Error("unreadable");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ImageInput({
  field,
  value,
  onChange,
  disabled,
  onError,
}: {
  field: { label: string; hint?: string };
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return onError("Please choose a JPG, PNG or WebP picture.");
    if (file.size > 15 * 1024 * 1024) return onError("That picture is too large (15 MB maximum before shrinking).");
    setBusy(true);
    try {
      const small = await shrinkImage(file);
      const form = new FormData();
      form.append("file", small, "picture");
      const res = await adminFetch<{ url: string }>("/api/admin/cms/upload", { method: "POST", body: form });
      if (!res.ok) onError(res.error);
      else onChange(res.data.url);
    } catch {
      onError("That picture could not be read. Try a different file.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <p className="text-[13px] font-medium text-fg">{field.label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line p-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-20 w-32 rounded-lg border border-line object-cover" />
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-surface-2 text-[12px] text-fg-subtle">No picture</div>
        )}
        {!disabled && (
          <div className="flex flex-wrap gap-2">
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            <button type="button" className={quietButton} disabled={busy} onClick={() => input.current?.click()}>
              {busy ? "Uploading…" : value ? "Change picture" : "Upload picture"}
            </button>
            {value && (
              <button type="button" className={dangerButton} disabled={busy} onClick={() => onChange("")}>
                Remove
              </button>
            )}
          </div>
        )}
      </div>
      {field.hint && <p className="mt-1 text-[12px] text-fg-subtle">{field.hint}</p>}
    </div>
  );
}

/** Add / edit / delete / hide / re-order a list of entries. Drag the handle, or use the arrows. */
function ListInput({
  field,
  value,
  onChange,
  disabled,
  onError,
}: {
  field: Extract<Field, { type: "list" }>;
  value: Value[];
  onChange: (v: Value[]) => void;
  disabled: boolean;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const editable = !disabled && !field.fixed;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = value.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setOpen(null);
  };

  const add = () => {
    const blank: Value = {};
    for (const f of field.fields) {
      if (f.type === "heading") continue;
      blank[f.name] = f.type === "toggle" ? false : f.type === "lines" ? [] : f.type === "select" ? f.options[0].value : "";
    }
    onChange([...value, blank]);
    setOpen(value.length);
  };

  return (
    <div>
      <p className="text-[13px] font-medium text-fg">{field.label}</p>
      {field.hint && <p className="mt-0.5 text-[12px] text-fg-subtle">{field.hint}</p>}
      <ul className="mt-2 space-y-2">
        {value.map((item, i) => {
          const isOpen = open === i;
          const title = String(item?.[field.titleField] ?? "").trim() || `New ${field.item}`;
          return (
            <li
              key={i}
              onDragOver={(e) => editable && dragFrom !== null && e.preventDefault()}
              onDrop={() => {
                if (editable && dragFrom !== null) move(dragFrom, i);
                setDragFrom(null);
              }}
              className={`rounded-xl border border-line bg-surface-2 ${item?.hidden ? "opacity-60" : ""} ${dragFrom === i ? "ring-2 ring-accent/40" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-1.5 p-2">
                {editable && (
                  <span
                    draggable
                    onDragStart={() => setDragFrom(i)}
                    onDragEnd={() => setDragFrom(null)}
                    title="Drag to re-order"
                    className="hidden cursor-grab select-none px-1 text-fg-subtle sm:block"
                    aria-hidden
                  >
                    ⠿
                  </span>
                )}
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="min-w-[8rem] flex-1 truncate px-1 py-1 text-left text-[14px] font-medium text-fg" aria-expanded={isOpen}>
                  {title}
                  {item?.hidden && <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[11px] font-normal text-fg-subtle">hidden</span>}
                </button>
                {editable && (
                  <>
                    <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>↑</IconButton>
                    <IconButton label="Move down" disabled={i === value.length - 1} onClick={() => move(i, i + 1)}>↓</IconButton>
                    <IconButton
                      label={item?.hidden ? "Show on the website" : "Hide from the website"}
                      onClick={() => onChange(value.map((x, j) => (j === i ? { ...x, hidden: !x?.hidden } : x)))}
                    >
                      {item?.hidden ? "Show" : "Hide"}
                    </IconButton>
                    <IconButton
                      label={`Delete this ${field.item}`}
                      danger
                      onClick={() => {
                        if (!window.confirm(`Delete “${title}”? This cannot be undone once you save.`)) return;
                        onChange(value.filter((_, j) => j !== i));
                        setOpen(null);
                      }}
                    >
                      Delete
                    </IconButton>
                  </>
                )}
                <IconButton label={isOpen ? "Close" : "Edit"} onClick={() => setOpen(isOpen ? null : i)}>
                  {isOpen ? "Close" : disabled ? "View" : "Edit"}
                </IconButton>
              </div>
              {isOpen && (
                <div className="grid gap-4 border-t border-line bg-surface p-3 sm:grid-cols-2">
                  {field.fields.map((f) =>
                    f.type === "heading" ? null : (
                      <div key={f.name} className={wide(f) ? "sm:col-span-2" : ""}>
                        <FieldInput
                          field={f}
                          value={item?.[f.name]}
                          disabled={disabled}
                          onError={onError}
                          onChange={(v) => onChange(value.map((x, j) => (j === i ? { ...x, [f.name]: v } : x)))}
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </li>
          );
        })}
        {!value.length && <li className="rounded-xl border border-dashed border-line p-4 text-center text-[13px] text-fg-subtle">Nothing here yet.</li>}
      </ul>
      {editable && value.length < 60 && (
        <button type="button" onClick={add} className={`${quietButton} mt-2`}>
          + Add {field.item}
        </button>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 rounded-lg px-2 py-1.5 text-[12.5px] transition-colors disabled:opacity-30 ${
        danger ? "text-danger hover:bg-danger-soft" : "text-fg-muted hover:bg-fg/5 hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
