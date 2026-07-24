import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function IconSend(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconAttach(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 12.5V8a5 5 0 0 0-10 0v9a3 3 0 0 0 6 0V9" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconMinimize(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconChat(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.1A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

export function IconBot(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="8" width="14" height="10" rx="3" />
      <path d="M12 4v4M9 12h.01M15 12h.01" />
    </svg>
  );
}

export function IconAgent(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function IconBack(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function IconEmoji(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10.5h.01M15.5 10.5h.01M8.5 15c1.2 1.2 5.8 1.2 7 0" />
    </svg>
  );
}

export function IconStatusDot({
  online,
  size = 8,
  className,
}: {
  online?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: online ? "#22c55e" : "#94a3b8",
        display: "inline-block",
      }}
      aria-hidden
    />
  );
}
