import { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, body, action, reveal = false }: { eyebrow?: string; title: ReactNode; body?: string; action?: ReactNode; reveal?: boolean }) {
  return (
    <div className="section-heading-row" data-reveal={reveal ? "" : undefined}>
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="section-title">{title}</h2>
        {body && <p className="section-subtitle">{body}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}
