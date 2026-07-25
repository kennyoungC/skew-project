import { ArrowRightIcon } from "@/components/icons";

export function SectionHeading({
  eyebrow,
  title,
  id,
  action,
}: {
  eyebrow: string;
  title: string;
  id: string;
  action?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
      </div>
      {action ? (
        <a className="text-link" href="#latest">
          {action}
          <ArrowRightIcon />
        </a>
      ) : null}
    </div>
  );
}
