import { toast as sonner } from "sonner";

export type AppNotification = {
  id: string;
  title: string;
  description?: string | undefined;
  tone: "success" | "error" | "info" | "warning";
  at: number;
  read: boolean;
};

type Listener = () => void;

let items: AppNotification[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export const notificationStore = {
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return items;
  },
  getServerSnapshot(): AppNotification[] {
    return [];
  },
  markAllRead() {
    items = items.map((n) => ({ ...n, read: true }));
    emit();
  },
  clear() {
    items = [];
    emit();
  },
};

type Opts = { description?: string } & Record<string, unknown>;

function push(tone: AppNotification["tone"], title: string, opts?: Opts) {
  items = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description: typeof opts?.description === "string" ? opts.description : undefined,
      tone,
      at: Date.now(),
      read: false,
    },
    ...items,
  ].slice(0, 50);
  emit();
}

/** Drop-in replacement for sonner's `toast` that also records an in-app notification. */
export const notify = Object.assign(
  (title: string, opts?: Opts) => {
    push("info", title, opts);
    return sonner(title, opts);
  },
  {
    success(title: string, opts?: Opts) {
      push("success", title, opts);
      return sonner.success(title, opts);
    },
    error(title: string, opts?: Opts) {
      push("error", title, opts);
      return sonner.error(title, opts);
    },
    warning(title: string, opts?: Opts) {
      push("warning", title, opts);
      return sonner.warning(title, opts);
    },
    info(title: string, opts?: Opts) {
      push("info", title, opts);
      return sonner.info(title, opts);
    },
    message(title: string, opts?: Opts) {
      push("info", title, opts);
      return sonner.message(title, opts);
    },
    dismiss: sonner.dismiss,
    loading: sonner.loading,
    promise: sonner.promise,
  },
);

export function timeAgo(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s} detik lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}
