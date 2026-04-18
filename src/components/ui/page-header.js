import clsx from "clsx";

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  asCard = true,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
}) {
  return (
    <header className={clsx(asCard && "soft-card p-4 md:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {eyebrow ? (
            <p
              className={clsx(
                "page-eyebrow",
                eyebrowClassName
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h1
              className={clsx(
                "page-title mt-1 text-2xl font-extrabold tracking-tight",
                titleClassName
              )}
            >
              {title}
            </h1>
          ) : null}
          {description ? (
            <p
              className={clsx(
                "page-subtitle mt-2 text-sm",
                descriptionClassName
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="w-full sm:w-auto">{actions}</div> : null}
      </div>
    </header>
  );
}
