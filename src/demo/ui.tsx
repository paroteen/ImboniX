/**
 * Shared ImboniX demo UI primitives — toggle cards, text fields, headers.
 */
import React from "react";
import { X } from "lucide-react";

export function ToggleCard({
  icon,
  title,
  description,
  on,
  onToggle,
  color = "#00F5FF",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  color?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="bg-cyber-dark-card border rounded-xl p-5 transition-all"
      style={{ borderColor: on ? `${color}66` : "#1f1f35" }}
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-cyber-dark-1 border border-neutral-800 shrink-0" style={{ color }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-sans font-bold text-white text-sm mb-1">{title}</h4>
          <p className="font-sans text-xs text-text-secondary leading-relaxed">{description}</p>
        </div>
        <button
          onClick={() => onToggle(!on)}
          role="switch"
          aria-checked={on}
          className="shrink-0 w-12 h-7 rounded-full p-1 transition-colors"
          style={{ backgroundColor: on ? color : "#2a2a40" }}
        >
          <span
            className="block w-5 h-5 rounded-full bg-white transition-transform"
            style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
          />
        </button>
      </div>
      {on && children && <div className="mt-4 pt-4 border-t border-neutral-800">{children}</div>}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-sans text-xs text-text-secondary mb-1.5 block">
        {label} {required && <span className="text-neon-magenta">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-cyber-dark-1 border border-neutral-800 focus:border-neon-cyan rounded-lg font-sans text-sm text-white placeholder-neutral-600 outline-none transition-colors"
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="font-sans text-xs text-text-secondary mb-1.5 block">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-cyber-dark-1 border border-neutral-800 focus:border-neon-cyan rounded-lg font-sans text-sm text-white outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StepHeader({
  title,
  subtitle,
  onExit,
}: {
  title: string;
  subtitle?: string;
  onExit?: () => void;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h2 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-tight">{title}</h2>
        {subtitle && <p className="font-sans text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {onExit && (
        <button
          onClick={onExit}
          aria-label="Exit"
          className="p-2 rounded-lg bg-cyber-dark-card border border-neutral-800 hover:border-neon-cyan text-text-secondary hover:text-white transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  color = "#00F5FF",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 rounded-xl font-sans font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
      style={{
        backgroundColor: disabled ? "#2a2a40" : color,
        color: disabled ? "#888" : "#0A0A0F",
        boxShadow: disabled ? "none" : `0 0 25px ${color}66`,
      }}
    >
      {children}
    </button>
  );
}
