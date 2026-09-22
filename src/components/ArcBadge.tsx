/** A rotating ring of curved text — the editorial "seal" that hugs the hero arches. */
export function ArcBadge({ id, text = "BHC Bingo · Parapharmacie · " }: { id: string; text?: string }) {
  const ring = text.repeat(2);
  return (
    <svg className="arc-badge" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id={id} d="M50,50 m-39,0 a39,39 0 1,1 78,0 a39,39 0 1,1 -78,0" fill="none" />
      </defs>
      <text>
        <textPath href={`#${id}`} startOffset="0">{ring}</textPath>
      </text>
    </svg>
  );
}
