import clsx from "clsx";
import PageHeader from "./page-header";
import SectionCard from "./section-card";

export default function AuthPanel({
  title,
  description,
  className,
  children,
  footer,
}) {
  return (
    <SectionCard className={clsx("w-full max-w-md p-6 md:p-6", className)}>
      <PageHeader
        asCard={false}
        title={title}
        description={description}
        titleClassName="text-2xl"
        descriptionClassName="text-sm"
      />

      <div className="mt-4">{children}</div>

      {footer ? <div className="mt-4 text-center text-sm page-subtitle">{footer}</div> : null}
    </SectionCard>
  );
}
