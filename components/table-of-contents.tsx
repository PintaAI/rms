"use client";

import { useEffect, useState, useCallback } from "react";
import { RiFileTextLine } from "@remixicon/react";

interface TocItem {
  level: number;
  title: string;
  href: string;
}

interface TableOfContentsProps {
  items: TocItem[];
}

// Offset in px to account for sticky header height
const SCROLL_OFFSET = 100;

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;

    // Use scrollIntoView with block: 'start' and manual offset via CSS scroll-margin-top
    element.scrollIntoView({ behavior: "smooth", block: "start" });

    // Update URL hash without triggering a jump
    history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  }, []);

  // Track active section using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: `-${SCROLL_OFFSET}px 0px -60% 0px`,
        threshold: 0,
      }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.href);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24">
        <div className="bg-muted/50 rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-4">
            <RiFileTextLine className="size-5" />
            <h3 className="font-semibold">Daftar Isi</h3>
          </div>
          <nav className="space-y-2">
            {items.map((item, index) => (
              <a
                key={index}
                href={`#${item.href}`}
                onClick={(e) => handleClick(e, item.href)}
                className={`block text-sm transition-colors ${
                  activeId === item.href
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{
                  paddingLeft: `${(item.level - 1) * 16}px`,
                }}
              >
                {item.title}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}