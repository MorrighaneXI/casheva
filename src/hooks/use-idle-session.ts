import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

interface UseIdleSessionOptions {
  timeoutMs?: number; // Total waktu sampai logout (default: 15 menit)
  warningMs?: number; // Waktu ketika peringatan muncul (default: 14 menit)
  onTimeout: () => void;
  enabled?: boolean;
}

export function useIdleSession({
  timeoutMs = 15 * 60 * 1000, // 15 menit
  warningMs = 14 * 60 * 1000, // 14 menit (peringatan 60 detik sebelum logout)
  onTimeout,
  enabled = true,
}: UseIdleSessionOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const lastActivityRef = useRef<number>(Date.now());
  const warningToastIdRef = useRef<string | number | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    if (warningToastIdRef.current) {
      toast.dismiss(warningToastIdRef.current);
      warningToastIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setShowWarning(false);
      if (warningToastIdRef.current) {
        toast.dismiss(warningToastIdRef.current);
        warningToastIdRef.current = null;
      }
      return;
    }

    // Reset timestamp saat sesi aktif dimulai
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
      if (warningToastIdRef.current) {
        toast.dismiss(warningToastIdRef.current);
        warningToastIdRef.current = null;
        setShowWarning(false);
      }
    };

    events.forEach((evt) =>
      window.addEventListener(evt, handleUserActivity, { passive: true }),
    );

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= timeoutMs) {
        clearInterval(interval);
        setShowWarning(false);
        if (warningToastIdRef.current) {
          toast.dismiss(warningToastIdRef.current);
          warningToastIdRef.current = null;
        }
        toast.error("Sesi Keamanan Berakhir", {
          description:
            "Anda otomatis dikeluarkan karena tidak ada aktivitas selama 15 menit (Session Timeout Protection).",
          duration: 6000,
        });
        onTimeout();
      } else if (elapsed >= warningMs) {
        const remainingSec = Math.max(1, Math.ceil((timeoutMs - elapsed) / 1000));
        setSecondsLeft(remainingSec);
        setShowWarning(true);

        if (!warningToastIdRef.current) {
          warningToastIdRef.current = toast.warning("Peringatan Inaktivitas Sesi", {
            description: `Sesi Anda akan berakhir dalam ${remainingSec} detik demi keamanan. Gerakkan mouse atau klik untuk tetap masuk.`,
            duration: Infinity,
            action: {
              label: "Tetap Masuk",
              onClick: () => resetActivity(),
            },
          });
        }
      } else {
        if (warningToastIdRef.current) {
          toast.dismiss(warningToastIdRef.current);
          warningToastIdRef.current = null;
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      events.forEach((evt) =>
        window.removeEventListener(evt, handleUserActivity),
      );
    };
  }, [enabled, timeoutMs, warningMs, onTimeout, resetActivity]);

  return {
    showWarning,
    secondsLeft,
    resetActivity,
  };
}
