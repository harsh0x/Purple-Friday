"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Users,
  ScrollText,
  Settings,
  Bell,
  ArrowRight,
  X,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string | null;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roleRequired?: string;
}

export function CommandPalette({ isOpen, onClose, userRole }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "overview",
        title: "Overview Dashboard",
        subtitle: "Key metrics, live dispatch SLA and operations status",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        id: "team",
        title: "Team & Roles Management",
        subtitle: "Invite staff, manage roles, deactivate accounts",
        href: "/admin/team",
        icon: Users,
        roleRequired: "SUPER_ADMIN",
      },
      {
        id: "audit",
        title: "Security & Audit Log",
        subtitle: "Search immutable log records and export CSV",
        href: "/admin/audit",
        icon: ScrollText,
        roleRequired: "SUPER_ADMIN",
      },
      {
        id: "settings",
        title: "Store & Integration Settings",
        subtitle: "Business details, GSTIN, time zone and API connections",
        href: "/admin/settings",
        icon: Settings,
        roleRequired: "SUPER_ADMIN",
      },
      {
        id: "notifications",
        title: "Notifications Center",
        subtitle: "Review system alerts, SLA alerts and role notifications",
        href: "/admin/notifications",
        icon: Bell,
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    return commands.filter((cmd) => {
      if (cmd.roleRequired && userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
        return false;
      }
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return cmd.title.toLowerCase().includes(q) || cmd.subtitle.toLowerCase().includes(q);
    });
  }, [commands, userRole, query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(filtered[selectedIndex].href);
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex, router]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15101F]/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#1C1628] border border-white/15 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-[#CDB8FF]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search pages... (e.g. settings, team)"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none font-sans"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-white/40">
              No matching pages or actions found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-colors ${
                    isSelected
                      ? "bg-[#6A2CFF] text-white shadow-md shadow-[#6A2CFF]/20"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-white/5 text-[#CDB8FF]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold tracking-tight">{item.title}</div>
                      <div
                        className={`text-[11px] truncate max-w-sm ${
                          isSelected ? "text-white/80" : "text-white/40 font-mono"
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? "translate-x-0.5 text-white" : "text-white/20"
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-black/20 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">↑↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">↵</kbd> select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">esc</kbd> close</span>
          </div>
          <span>Purple Friday Control Room</span>
        </div>
      </div>
    </div>
  );
}
