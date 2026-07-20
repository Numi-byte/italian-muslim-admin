// src/components/ui.tsx
// -------------------------------------------------------------
// Shared clean-light design system for the UmmahWay admin console.
// Purely presentational primitives — no business logic lives here.
// -------------------------------------------------------------
import React from "react";

/** Tiny className combiner (keeps JSX tidy without a dependency). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// -------------------------------------------------------------
// Surfaces
// -------------------------------------------------------------

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<DivProps> = ({ className, ...rest }) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]",
      className
    )}
    {...rest}
  />
);

/**
 * A titled content card. `title`/`description` render a clean header row,
 * `actions` sits on the right, and children fill the body.
 */
export const SectionCard: React.FC<
  DivProps & {
    title?: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    bodyClassName?: string;
  }
> = ({ title, description, actions, children, className, bodyClassName, ...rest }) => (
  <Card className={cn("overflow-hidden", className)} {...rest}>
    {(title || description || actions) && (
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          {title && (
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={cn("p-5", bodyClassName)}>{children}</div>
  </Card>
);

// -------------------------------------------------------------
// Buttons
// -------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 focus-visible:ring-emerald-500/25",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-300/40",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300/40",
  danger:
    "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-400/30",
  subtle:
    "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-500/20",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
> = ({ variant = "primary", size = "md", className, type = "button", ...rest }) => (
  <button
    type={type}
    className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
    {...rest}
  />
);

// -------------------------------------------------------------
// Form controls
// -------------------------------------------------------------

const CONTROL_BASE =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm shadow-slate-900/[0.02] outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...rest }, ref) => (
  <input ref={ref} className={cn(CONTROL_BASE, className)} {...rest} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cn(CONTROL_BASE, "min-h-[96px] resize-y", className)} {...rest} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...rest }, ref) => (
  <select ref={ref} className={cn(CONTROL_BASE, "appearance-none pr-9", className)} {...rest} />
));
Select.displayName = "Select";

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className,
  ...rest
}) => (
  <label
    className={cn(
      "block text-xs font-semibold uppercase tracking-wide text-slate-500",
      className
    )}
    {...rest}
  />
);

/** Label + control wrapper with consistent vertical rhythm. */
export const Field: React.FC<{
  label?: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, hint, htmlFor, className, children }) => (
  <div className={cn("space-y-1.5", className)}>
    {label && <Label htmlFor={htmlFor}>{label}</Label>}
    {children}
    {hint && <p className="text-[11px] leading-4 text-slate-400">{hint}</p>}
  </div>
);

// -------------------------------------------------------------
// Badges / status
// -------------------------------------------------------------

type BadgeTone = "emerald" | "slate" | "amber" | "rose" | "sky" | "violet";

const BADGE_TONES: Record<BadgeTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/15",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
};

export const Badge: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }
> = ({ tone = "slate", className, ...rest }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
      BADGE_TONES[tone],
      className
    )}
    {...rest}
  />
);

// -------------------------------------------------------------
// Stat card
// -------------------------------------------------------------

export const StatCard: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, value, hint, icon, className }) => (
  <Card className={cn("p-4", className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 truncate text-2xl font-bold text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
      {icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          {icon}
        </span>
      )}
    </div>
  </Card>
);

// -------------------------------------------------------------
// Feedback: alerts, empty states, spinners
// -------------------------------------------------------------

type AlertTone = "info" | "success" | "warning" | "error";

const ALERT_TONES: Record<AlertTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
};

export const Alert: React.FC<DivProps & { tone?: AlertTone }> = ({
  tone = "info",
  className,
  ...rest
}) => (
  <div
    className={cn(
      "rounded-xl border px-4 py-3 text-xs font-medium leading-5",
      ALERT_TONES[tone],
      className
    )}
    {...rest}
  />
);

export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={cn(
      "inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent",
      className
    )}
  />
);

export const LoadingBlock: React.FC<{ label?: string; className?: string }> = ({
  label = "Loading…",
  className,
}) => (
  <div
    className={cn(
      "flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500",
      className
    )}
  >
    <Spinner />
    <span>{label}</span>
  </div>
);

export const EmptyState: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, description, icon, action, className }) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center",
      className
    )}
  >
    {icon && (
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
        {icon}
      </span>
    )}
    <p className="text-sm font-semibold text-slate-800">{title}</p>
    {description && (
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/** Horizontal toolbar row (search + filters + actions) that wraps on mobile. */
export const Toolbar: React.FC<DivProps> = ({ className, ...rest }) => (
  <div
    className={cn("flex flex-wrap items-center gap-2 sm:gap-3", className)}
    {...rest}
  />
);
