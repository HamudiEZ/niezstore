import SectionCard from "../ui/section-card";

export default function AdminSectionCard({
  title,
  description,
  actions,
  className = "",
  children,
}) {
  return (
    <SectionCard
      title={title}
      description={description}
      actions={actions}
      className={className}
      titleClassName="admin-title"
      descriptionClassName="admin-subtitle"
    >
      {children}
    </SectionCard>
  );
}
