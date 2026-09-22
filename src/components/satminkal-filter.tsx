import React, { useEffect, useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { apiKotama, type SatminkalSummaryItem } from "@/lib/api";
import { useSession } from "@/components/session-context";

interface SatminkalFilterProps {
  value: string;
  onChange: (satminkalId: string) => void;
  className?: string;
  showAllOption?: boolean;
  disabled?: boolean;
}

export function SatminkalFilter({
  value,
  onChange,
  className = "",
  showAllOption = true,
  disabled = false,
}: SatminkalFilterProps) {
  const { isKotamaAdmin, isGuestMode, kotamaId } = useSession();
  const [list, setList] = useState<SatminkalSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await apiKotama.getSatminkalList(kotamaId);
        if (isMounted) {
          setList(data || []);
        }
      } catch (e) {
        console.warn("Gagal memuat daftar satminkal untuk filter:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (isKotamaAdmin || isGuestMode) {
      load();
    }
    return () => {
      isMounted = false;
    };
  }, [isKotamaAdmin, isGuestMode, kotamaId]);

  // If not Kotama Admin and not in Guest Mode, don't show the multi-satminkal filter
  if (!isKotamaAdmin && !isGuestMode) {
    return null;
  }

  const selectedItem = list.find((s) => s.id === value);
  const displayLabel = !value || value === "all" || value === ""
    ? "Semua Satminkal Kotama"
    : selectedItem
      ? selectedItem.nama
      : "Pilih Satminkal";

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="truncate max-w-[200px]">{displayLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl z-50 py-1.5 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800">
              Filter Satminkal Kotama
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40">
              {showAllOption && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-500/10 transition-colors ${
                    !value || value === "all" || value === ""
                      ? "text-emerald-400 font-bold bg-emerald-500/5"
                      : "text-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Semua Satminkal (Gabungan)</span>
                  </span>
                  {(!value || value === "all" || value === "") && (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>
              )}

              {list.map((s) => {
                const isSelected = value === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onChange(s.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-500/10 transition-colors ${
                      isSelected
                        ? "text-emerald-400 font-bold bg-emerald-500/5"
                        : "text-slate-300"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate font-medium">{s.nama}</div>
                      <div className="text-[10px] text-slate-400">{s.kode}</div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
