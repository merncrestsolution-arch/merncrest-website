"use client";

export function FileAttachmentPreview({
  name,
  uploading,
  error,
  onClear,
}: {
  name: string | null;
  uploading?: boolean;
  error?: string | null;
  onClear?: () => void;
}) {
  if (!name && !error && !uploading) return null;
  return (
    <div className="mx-4 mb-2 flex items-center justify-between rounded-xl bg-[#EEF5FB] px-3 py-2 text-[12px] text-[#105691]">
      <span className="truncate">
        {uploading ? "Uploading…" : error ? error : name}
      </span>
      {onClear && !uploading ? (
        <button type="button" onClick={onClear} className="ml-2 shrink-0 underline">
          Remove
        </button>
      ) : null}
    </div>
  );
}
