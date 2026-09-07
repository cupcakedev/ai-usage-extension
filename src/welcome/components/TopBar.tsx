export function TopBar({ iconUrl, title }: { iconUrl: string; title: string }) {
  return (
    <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 z-10">
      <div className="flex items-center gap-[10px]">
        <img src={iconUrl} alt="" className="h-7 w-7 rounded-[7px]" />
        <span className="text-[15px] font-semibold tracking-[-0.2px] text-[var(--w-text)]">
          {title}
        </span>
      </div>
    </div>
  );
}
