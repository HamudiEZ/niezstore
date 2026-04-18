import clsx from "clsx";

export default function PasswordStrengthMeter({
  label = "Sin evaluar",
  percent = 0,
  tone = "idle",
  hint = "",
  feedback = "",
}) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const toneClass = `password-strength__tone--${tone}`;
  const fillClass = `password-strength__fill--${tone}`;

  return (
    <section className="password-strength" aria-live="polite">
      <header className="password-strength__header">
        <p className="password-strength__caption">
          Seguridad de contraseña
        </p>
        <p className={clsx("password-strength__tone", toneClass)}>{label}</p>
      </header>

      <div
        className="password-strength__track"
        role="progressbar"
        aria-label="Fortaleza de contraseña"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safePercent}
      >
        <div
          className={clsx("password-strength__fill", fillClass)}
          style={{ width: `${safePercent}%` }}
        />
      </div>

      {hint ? <p className="password-strength__hint">{hint}</p> : null}
      {feedback ? (
        <p className="password-strength__feedback">{feedback}</p>
      ) : null}
    </section>
  );
}
