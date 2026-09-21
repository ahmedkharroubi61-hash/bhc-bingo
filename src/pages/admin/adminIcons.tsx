interface IconProps { size?: number }

const base = (size: number) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const, "aria-hidden": true,
});

export function IconGrid({ size = 18 }: IconProps) {
  return (<svg {...base(size)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>);
}
export function IconBox({ size = 18 }: IconProps) {
  return (<svg {...base(size)}><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></svg>);
}
export function IconReceipt({ size = 18 }: IconProps) {
  return (<svg {...base(size)}><path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3 5 4.5z" /><path d="M8 8h8M8 12h6" /></svg>);
}
export function IconRevenue({ size = 18 }: IconProps) {
  return (<svg {...base(size)}><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
}
export function IconTrend({ size = 18 }: IconProps) {
  return (<svg {...base(size)}><path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" /></svg>);
}
export function IconClock({ size = 18 }: IconProps) {
  return (<svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
}
export function IconStarBadge({ size = 18 }: IconProps) {
  return (<svg {...base(size)}><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z" /></svg>);
}
export function IconExternal({ size = 15 }: IconProps) {
  return (<svg {...base(size)}><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>);
}
export function IconLock({ size = 16 }: IconProps) {
  return (<svg {...base(size)}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>);
}
