import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useStudio } from "./useStudio";
import { resolveActiveTheme } from "./studioStore";
import { discoverImageSlots, discoverSurfaceCandidates, discoverTextFields, listPageImageSlots } from "./studioDom";

type PanelProps = {
  selectedSurfaceKey: string;
  onSelectSurface: (key: string) => void;
};

export function InspectorPanel({ selectedSurfaceKey, onSelectSurface }: PanelProps) {
  const { state, pinnedComponentId, setPinnedComponentId, blocks, uploadImage } = useStudio();

  const pinnedBlock = useMemo(
    () => blocks.find((block) => block.id === pinnedComponentId),
    [blocks, pinnedComponentId],
  );

  const imageSlots = useMemo(
    () => (pinnedComponentId ? discoverImageSlots(pinnedComponentId) : []),
    [pinnedComponentId],
  );

  const surfaceCandidates = useMemo(
    () => (pinnedComponentId ? discoverSurfaceCandidates(pinnedComponentId) : []),
    [pinnedComponentId],
  );

  const uploadedSlots = useMemo(() => {
    const uploads = state.session?.uploads ?? [];
    return new Map(uploads.map((upload) => [upload.slotKey, upload.url]));
  }, [state.session?.uploads]);

  if (!pinnedComponentId) {
    return (
      <EmptyPanel
        title="No selection yet"
        body="Choose a block from the page list or click one on the site to start inspecting it."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-charcoal/10 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-charcoal/8 bg-cream/40">
          <div>
            <div className="font-mono-label text-[9px] uppercase tracking-widest text-clay">Selected block</div>
            <div className="font-heading text-sm text-charcoal mt-0.5">
              {pinnedBlock?.label ?? pinnedComponentId}
            </div>
            <div className="mt-1 text-xs text-charcoal/45">Choose a section target, then refine a card, button, or image inside it.</div>
          </div>
          <button
            type="button"
            onClick={() => setPinnedComponentId(null)}
            className="rounded-full border border-charcoal/10 bg-white px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/60 hover:bg-cream transition-colors"
          >
            Unpin
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-xl border border-charcoal/10 bg-cream/30 p-3">
            <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/40 mb-2">
              Style target
            </div>
            <div className="space-y-2">
              <TargetButton
                active={selectedSurfaceKey === "__root"}
                title="Whole section"
                subtitle="Use this for the overall background, text tone, and section-level treatment."
                onClick={() => onSelectSurface("__root")}
              />
              {surfaceCandidates
                .filter((candidate) => candidate.key !== "__root")
                .map((candidate) => (
                  <TargetButton
                    key={candidate.key}
                    active={selectedSurfaceKey === candidate.key}
                    title={candidate.label}
                    subtitle={candidate.key}
                    onClick={() => onSelectSurface(candidate.key)}
                  />
                ))}
            </div>
          </div>

          {imageSlots.length > 0 && (
            <div className="rounded-xl border border-charcoal/10 bg-cream/30 p-3 space-y-2">
              <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/40">
                Images in this block
              </div>
              {imageSlots.map(({ slotKey }) => (
                <ImageSlotRow
                  key={slotKey}
                  slotKey={slotKey}
                  uploadedUrl={uploadedSlots.get(slotKey)}
                  uploadImage={uploadImage}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageImageLibrary() {
  const { state, uploadImage, setPinnedComponentId } = useStudio();

  const pageImageSlots = useMemo(() => listPageImageSlots(), [state.enabled, state.session?.uploads]);
  const uploadedSlots = useMemo(() => {
    const uploads = state.session?.uploads ?? [];
    return new Map(uploads.map((upload) => [upload.slotKey, upload.url]));
  }, [state.session?.uploads]);

  if (pageImageSlots.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-4 space-y-3">
      <div>
        <div className="font-mono-label text-[9px] uppercase tracking-widest text-clay">Page images</div>
        <div className="mt-1 text-sm text-charcoal/55">
          Upload to any indexed image slot on this page without changing the current tab flow.
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {pageImageSlots.map((slot) => (
          <div key={slot.slotKey} className="rounded-xl border border-charcoal/10 bg-cream/20 p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <div className="text-sm text-charcoal">
                  {slot.slotKey
                    .split(".")
                    .slice(-2)
                    .join(" ")
                    .replace(/[-_]+/g, " ")}
                </div>
                <div className="mt-1 font-mono-label text-[9px] uppercase tracking-widest text-charcoal/35">
                  {slot.slotKey}
                </div>
              </div>
              {slot.componentId ? (
                <button
                  type="button"
                  onClick={() => setPinnedComponentId(slot.componentId ?? null)}
                  className="rounded-full border border-charcoal/10 bg-white px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/55 hover:bg-cream"
                >
                  Jump to block
                </button>
              ) : null}
            </div>
            <ImageSlotRow
              slotKey={slot.slotKey}
              uploadedUrl={uploadedSlots.get(slot.slotKey) ?? slot.currentSrc}
              uploadImage={uploadImage}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StudioTextPanel() {
  const { blocks, pinnedComponentId, edits, setEdit, clearEdit } = useStudio();

  const pinnedBlock = useMemo(
    () => blocks.find((block) => block.id === pinnedComponentId),
    [blocks, pinnedComponentId],
  );

  const fields = useMemo(
    () => (pinnedComponentId ? discoverTextFields(pinnedComponentId, edits) : []),
    [edits, pinnedComponentId],
  );

  if (!pinnedComponentId) {
    return (
      <EmptyPanel
        title="Choose a block first"
        body="Use Inspect to pick the exact section you want to edit, then come back here for its copy."
      />
    );
  }

  return (
    <div className="space-y-3">
      <PanelHeader
        eyebrow="Text editor"
        title={pinnedBlock?.label ?? pinnedComponentId}
        subtitle="Edit only the copy that belongs to the currently selected block."
      />
      <div className="rounded-2xl border border-charcoal/10 bg-white p-4 space-y-3">
        {fields.length === 0 ? (
          <div className="text-sm text-charcoal/50">
            This block does not expose editable text yet.
          </div>
        ) : (
          fields.map((field) => (
            <div key={field.key} className="rounded-xl border border-charcoal/10 bg-cream/20 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm text-charcoal">{field.label}</div>
                  <div className="mt-1 font-mono-label text-[9px] uppercase tracking-widest text-charcoal/35">
                    {field.key}
                  </div>
                </div>
                {field.edited ? (
                  <button
                    type="button"
                    onClick={() => clearEdit(field.key)}
                    className="rounded-full border border-charcoal/10 bg-white px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/50 hover:bg-cream"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
              <EditableValue
                value={field.currentValue}
                onSave={(nextValue) => setEdit(field.key, nextValue, { oldValue: field.defaultValue })}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function StudioThemePanel({ selectedSurfaceKey, onSelectSurface }: PanelProps) {
  const { blocks, pinnedComponentId, edits, setEdit, clearEdit, state, setCustomTheme } = useStudio();
  const activeTheme = resolveActiveTheme(state.themePresetId, state.customTheme);

  const pinnedBlock = useMemo(
    () => blocks.find((block) => block.id === pinnedComponentId),
    [blocks, pinnedComponentId],
  );

  const surfaceCandidates = useMemo(
    () => (pinnedComponentId ? discoverSurfaceCandidates(pinnedComponentId) : []),
    [pinnedComponentId],
  );

  const selectedSurface = useMemo(
    () => surfaceCandidates.find((candidate) => candidate.key === selectedSurfaceKey) ?? surfaceCandidates[0] ?? null,
    [selectedSurfaceKey, surfaceCandidates],
  );

  if (!pinnedComponentId) {
    return (
      <EmptyPanel
        title="Choose a block first"
        body="Use Inspect to choose the block or inner surface you want to style."
      />
    );
  }

  const targetPrefix =
    selectedSurface && selectedSurface.key !== "__root"
      ? `${pinnedComponentId}.__node.${selectedSurface.key}`
      : pinnedComponentId;
  const backgroundToneKey = `${targetPrefix}.__backgroundTone`;
  const borderToneKey = `${targetPrefix}.__borderTone`;
  const textToneKey = `${targetPrefix}.__textTone`;

  const selectedBackgroundTone = edits[backgroundToneKey] ?? "inherit";
  const selectedBorderTone = edits[borderToneKey] ?? "inherit";
  const selectedTextTone = edits[textToneKey] ?? "inherit";

  return (
    <div className="space-y-3">
      <PanelHeader
        eyebrow="Theme editor"
        title={pinnedBlock?.label ?? pinnedComponentId}
        subtitle="Style the selected target, then adjust the page palette if needed."
      />

      <div className="rounded-2xl border border-charcoal/10 bg-white p-4 space-y-4">
        <div className="rounded-xl border border-charcoal/10 bg-cream/20 p-3">
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/40 mb-2">
            Current style target
          </div>
          <div className="flex flex-wrap gap-2">
            <TargetChip
              active={selectedSurfaceKey === "__root"}
              label="Whole section"
              onClick={() => onSelectSurface("__root")}
            />
            {surfaceCandidates
              .filter((candidate) => candidate.key !== "__root")
              .map((candidate) => (
                <TargetChip
                  key={candidate.key}
                  active={selectedSurfaceKey === candidate.key}
                  label={candidate.label}
                  onClick={() => onSelectSurface(candidate.key)}
                />
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-charcoal/10 bg-cream/20 p-3 space-y-3">
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/40">
            Selected target styling
          </div>
          <TokenRow
            label="Background role"
            value={selectedBackgroundTone}
            options={[
              { value: "inherit", label: "Inherit" },
              { value: "page", label: "Page" },
              { value: "surface-main", label: "Main" },
              { value: "surface-sub", label: "Sub" },
              { value: "accent", label: "Accent" },
              { value: "contrast", label: "Contrast" },
            ]}
            onChange={(value) => {
              if (value === "inherit") clearEdit(backgroundToneKey);
              else setEdit(backgroundToneKey, value, { oldValue: selectedBackgroundTone });
            }}
          />
          <TokenRow
            label="Border role"
            value={selectedBorderTone}
            options={[
              { value: "inherit", label: "Inherit" },
              { value: "surface-main", label: "Main" },
              { value: "surface-sub", label: "Sub" },
              { value: "accent", label: "Accent" },
              { value: "contrast", label: "Contrast" },
            ]}
            onChange={(value) => {
              if (value === "inherit") clearEdit(borderToneKey);
              else setEdit(borderToneKey, value, { oldValue: selectedBorderTone });
            }}
          />
          <TokenRow
            label="Text colour"
            value={selectedTextTone}
            options={[
              { value: "inherit", label: "Inherit" },
              { value: "text-main", label: "Primary" },
              { value: "text-sub", label: "Muted" },
              { value: "accent", label: "Accent" },
              { value: "contrast", label: "Contrast" },
            ]}
            onChange={(value) => {
              if (value === "inherit") clearEdit(textToneKey);
              else setEdit(textToneKey, value, { oldValue: selectedTextTone });
            }}
          />
        </div>

        <div className="rounded-xl border border-charcoal/10 bg-cream/20 p-3">
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/40 mb-3">
            Page palette
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CompactColorField
              label="Page"
              value={activeTheme.pageBackground}
              onChange={(value) => setCustomTheme({ pageBackground: value })}
            />
            <CompactColorField
              label="Main"
              value={activeTheme.surfaceMain}
              onChange={(value) => setCustomTheme({ surfaceMain: value })}
            />
            <CompactColorField
              label="Sub"
              value={activeTheme.surfaceSub}
              onChange={(value) => setCustomTheme({ surfaceSub: value })}
            />
            <CompactColorField
              label="Primary text"
              value={activeTheme.textMain}
              onChange={(value) => setCustomTheme({ textMain: value })}
            />
            <CompactColorField
              label="Muted text"
              value={activeTheme.textSub}
              onChange={(value) => setCustomTheme({ textSub: value })}
            />
            <CompactColorField
              label="Accent"
              value={activeTheme.accent}
              onChange={(value) => setCustomTheme({ accent: value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
      <div className="font-mono-label text-[9px] uppercase tracking-widest text-clay">{eyebrow}</div>
      <div className="mt-1 font-heading text-base text-charcoal">{title}</div>
      <div className="mt-1 text-sm text-charcoal/55">{subtitle}</div>
    </div>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-charcoal/15 bg-cream/30 py-6 px-4 text-center">
      <div className="font-heading text-base text-charcoal">{title}</div>
      <p className="mt-2 text-sm text-charcoal/50">{body}</p>
    </div>
  );
}

function TargetButton({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border px-3 py-3 text-left transition-colors",
        active ? "border-clay bg-white" : "border-charcoal/10 bg-white hover:bg-cream/50",
      )}
    >
      <div className="text-sm text-charcoal">{title}</div>
      <div className="mt-1 font-mono-label text-[9px] uppercase tracking-widest text-charcoal/35">{subtitle}</div>
    </button>
  );
}

function TargetChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest transition-colors",
        active ? "border-charcoal bg-charcoal text-cream" : "border-charcoal/15 bg-white text-charcoal/60 hover:bg-cream",
      )}
    >
      {label}
    </button>
  );
}

function TokenRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="text-[11px] text-charcoal/60 mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest transition-colors",
              value === option.value
                ? "border-charcoal bg-charcoal text-cream"
                : "border-charcoal/15 bg-white text-charcoal/60 hover:bg-cream",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CompactColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-charcoal/10 bg-white px-3 py-2">
      <span
        className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl border border-charcoal/10"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          data-studio-ui="1"
        />
      </span>
      <span className="font-mono-label text-[10px] uppercase tracking-widest text-charcoal/55">{label}</span>
    </label>
  );
}

function EditableValue({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <div
        className="text-sm text-charcoal cursor-pointer hover:text-clay transition-colors"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={2}
        className="w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
        autoFocus
        data-studio-ui="1"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            onSave(draft);
            setEditing(false);
          }}
          className="rounded-full bg-charcoal text-cream px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ImageSlotRow({
  slotKey,
  uploadedUrl,
  uploadImage,
}: {
  slotKey: string;
  uploadedUrl?: string;
  uploadImage: (file: File, slotKey: string) => Promise<string | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(uploadedUrl ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setLocalPreview(objectUrl);
    setShowConfirm(true);
    if (inputRef.current) inputRef.current.value = "";
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    const finalUrl = await uploadImage(pendingFile, slotKey);
    setUploading(false);
    setShowConfirm(false);
    if (finalUrl) {
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(finalUrl);
    }
    setPendingFile(null);
  };

  const cancelUpload = () => {
    if (localPreview && localPreview !== uploadedUrl) URL.revokeObjectURL(localPreview);
    setLocalPreview(uploadedUrl ?? null);
    setPendingFile(null);
    setShowConfirm(false);
  };

  const label = slotKey
    .split(".")
    .slice(-2)
    .join(" ")
    .replace(/[-_]+/g, " ");

  return (
    <>
      <div className="flex items-center gap-3 py-2">
        <div
          className="w-14 h-10 rounded-xl border border-charcoal/10 bg-cream/60 overflow-hidden flex-none"
          style={
            localPreview
              ? { backgroundImage: `url("${localPreview}")`, backgroundSize: "cover", backgroundPosition: "center" }
              : {}
          }
        >
          {!localPreview ? (
            <div className="w-full h-full flex items-center justify-center text-charcoal/20 text-lg">⬚</div>
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/50 truncate mb-1">
            {label}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-charcoal/20 bg-white px-3 py-1 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/70 hover:bg-cream transition-colors disabled:opacity-40"
          >
            {uploading ? "Uploading…" : localPreview ? "Replace" : "Upload image"}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileSelect}
          data-studio-ui="1"
        />
      </div>

      {showConfirm && localPreview ? (
        <div className="rounded-xl border border-charcoal/10 bg-cream/60 p-3 space-y-2">
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/50">Preview</div>
          <img src={localPreview} alt="Preview" className="w-full max-h-32 object-contain rounded-lg" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmUpload}
              disabled={uploading}
              className="flex-1 rounded-full bg-charcoal text-cream px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={cancelUpload}
              disabled={uploading}
              className="flex-1 rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
