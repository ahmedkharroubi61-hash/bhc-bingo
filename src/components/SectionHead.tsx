import type { ReactNode } from "react";

export function SectionHead({ idx, title, meta, id }: { idx: string; title: string; meta?: ReactNode; id?: string }) {
  return (
    <div className="sec-head">
      <div className="sec-title"><span className="idx">{idx}</span><h2 id={id}>{title}</h2></div>
      {meta ? <div className="sec-meta">{meta}</div> : null}
    </div>
  );
}
