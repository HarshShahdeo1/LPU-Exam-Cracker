type ProgressBarProps = {
  label: string;
  value: number;
};

export function ProgressBar({ label, value }: ProgressBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-[#4f5c6e]">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border border-[#d7dde8] bg-[#eef1f8]">
        <div
          className="shimmer relative h-full overflow-hidden rounded-full bg-[linear-gradient(90deg,#ab95fb_0%,#ff74a5_50%,#e0ff57_100%)] transition-[width] duration-500 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
