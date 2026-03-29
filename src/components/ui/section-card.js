import clsx from "clsx";

export default function SectionCard({
  as: Element = "section",
  title,
  description,
  actions,
  className,
  headerClassName,
  bodyClassName,
  titleClassName,
  descriptionClassName,
  children,
}) {
  return (
    <Element className={clsx("soft-card p-4 md:p-5", className)}>
      {title || description || actions ? (
        <div
          className={clsx(
            "mb-4 flex flex-wrap items-start justify-between gap-3",
            headerClassName
          )}
        >
          <div>
            {title ? (
              <h2 className={clsx("page-title text-base font-bold", titleClassName)}>
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className={clsx("page-subtitle mt-1 text-xs", descriptionClassName)}>
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}

      <div className={bodyClassName}>{children}</div>
    </Element>
  );
}
