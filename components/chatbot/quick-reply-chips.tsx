"use client";

export function QuickReplyChips({
  items,
  onSelect,
  disabled,
}: {
  items: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item)}
          className="rounded-full border border-[#c5dced] bg-white px-3 py-1.5 text-[13px] text-[#105691] transition duration-200 ease-out hover:border-[#1873A8] hover:bg-[#EEF5FB] disabled:opacity-50"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
