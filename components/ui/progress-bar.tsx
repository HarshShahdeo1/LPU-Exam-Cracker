type ProgressBarProps = {
  label: string;
  value: number;
};

export function ProgressBar({ label, value }: ProgressBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border border-white/10 bg-white/10">
        <div
          className="shimmer relative h-full overflow-hidden rounded-full bg-gradient-to-r from-[#751112] via-[#c92416] to-[#ffd7cb] transition-[width] duration-500 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
