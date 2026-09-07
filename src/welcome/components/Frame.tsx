export function Frame({ src }: { src: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[24px] border border-[var(--w-border-hi)] bg-[var(--w-surface-hi)] shadow-[0_28px_80px_-56px_rgba(0,0,0,0.75)]">
      <img src={src} alt="" className="w-full block" />
    </div>
  );
}
