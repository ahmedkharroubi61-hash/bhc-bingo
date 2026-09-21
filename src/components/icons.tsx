type P = { size?: number };
const s = (n = 22) => ({ width: n, height: n, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, "aria-hidden": true } as const);

export const IconSearch = ({ size = 18 }: P) => (<svg {...s(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>);
export const IconUser = ({ size = 22 }: P) => (<svg {...s(size)}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>);
export const IconHeart = ({ size = 18 }: P) => (<svg {...s(size)}><path d="M16.5 3.5c-1.74 0-3.41.81-4.5 2.18C10.91 4.31 9.24 3.5 7.5 3.5 4.6 3.5 2.25 5.85 2.25 8.75c0 3.62 3.26 6.57 8.2 11.05l1.55 1.4 1.55-1.4c4.94-4.48 8.2-7.43 8.2-11.05C21.75 5.85 19.4 3.5 16.5 3.5z" /></svg>);
export const IconCart = ({ size = 22 }: P) => (<svg {...s(size)}><circle cx="9" cy="20" r="1.6" /><circle cx="18" cy="20" r="1.6" /><path d="M2 3h3l2.2 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L22 7H6" /></svg>);
export const IconMenu = ({ size = 22 }: P) => (<svg {...s(size)}><path d="M3 6h18M3 12h18M3 18h18" /></svg>);
export const IconArrow = ({ size = 16 }: P) => (<svg {...s(size)} strokeWidth={1.8}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconShield = ({ size = 17 }: P) => (<svg {...s(size)}><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>);
export const IconLock = ({ size = 17 }: P) => (<svg {...s(size)}><rect x="3" y="11" width="18" height="10" rx="1" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
export const IconTruck = ({ size = 17 }: P) => (<svg {...s(size)}><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><circle cx="7" cy="17" r="1.6" /><circle cx="17" cy="17" r="1.6" /></svg>);
export const IconStar = ({ size = 14 }: P) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" /></svg>);
