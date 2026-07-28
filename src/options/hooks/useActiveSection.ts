import { useEffect, useState, type RefObject } from 'react';

interface ActiveSection {
  activeId: string;
  /** Lets navigation clicks highlight instantly instead of waiting for scroll events. */
  setActiveId: (id: string) => void;
}

/**
 * Tracks which section is currently under the top of the scroll container so the
 * side navigation can highlight it. Falls back to the first id before any scroll.
 */
export const useActiveSection = (
  scrollRef: RefObject<HTMLElement | null>,
  ids: string[],
  enabled: boolean,
): ActiveSection => {
  const [activeId, setActiveId] = useState(ids[0] ?? '');

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !enabled) return;

    const resolveActive = (): void => {
      const anchor = container.getBoundingClientRect().top + 96;
      const current = ids.reduce((selected, id) => {
        const element = document.getElementById(id);
        if (!element) return selected;
        return element.getBoundingClientRect().top <= anchor ? id : selected;
      }, ids[0] ?? '');

      // Only when the column actually scrolls can the last section be the target;
      // otherwise everything fits and the section under the anchor wins.
      const scrollable = container.scrollHeight > container.clientHeight + 4;
      const reachedBottom =
        scrollable && container.scrollTop + container.clientHeight >= container.scrollHeight - 4;
      setActiveId(reachedBottom ? (ids[ids.length - 1] ?? current) : current);
    };

    resolveActive();
    container.addEventListener('scroll', resolveActive, { passive: true });
    window.addEventListener('resize', resolveActive);

    return () => {
      container.removeEventListener('scroll', resolveActive);
      window.removeEventListener('resize', resolveActive);
    };
  }, [scrollRef, ids, enabled]);

  return { activeId, setActiveId };
};
