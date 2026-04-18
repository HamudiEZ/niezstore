import clsx from "clsx";

const GAP_CLASSES = {
  sm: "space-y-4 md:space-y-5",
  md: "space-y-5 md:space-y-6",
  lg: "space-y-6 md:space-y-7",
};

export default function PageShell({ children, className, gap = "md" }) {
  return (
    <div className={clsx(GAP_CLASSES[gap] ?? GAP_CLASSES.md, className)}>
      {children}
    </div>
  );
}
