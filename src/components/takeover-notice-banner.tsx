import { useState, useEffect } from "react";
import { ShieldAlert, X } from "lucide-react";

export function TakeoverNoticeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("casheva.session_takeover_notice") === "1") {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <span className="font-bold">Pemberitahuan Keamanan Sesi:</span> Akun ini baru saja diakses dari perangkat ini. Sesi login sebelumnya pada perangkat lain telah dinonaktifkan secara otomatis.
        </div>
      </div>
      <button
        onClick={() => {
          sessionStorage.removeItem("casheva.session_takeover_notice");
          setVisible(false);
        }}
        className="rounded p-1 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors"
        title="Tutup pemberitahuan"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
