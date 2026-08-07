export type BackupPayload<T> = {
  version: "1.0";
  exportedAt: string;
  data: T;
};

export const createBackupPayload = <T>(data: T): BackupPayload<T> => ({
  version: "1.0",
  exportedAt: new Date().toISOString(),
  data,
});

export const exportBackupJson = <T>(data: T, filename = "casheva-backup.json") => {
  const payload = createBackupPayload(data);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const parseBackupJson = async <T>(file: File): Promise<BackupPayload<T>> => {
  const raw = await file.text();
  const parsed = JSON.parse(raw) as BackupPayload<T>;
  if (!parsed?.version || !parsed?.exportedAt || parsed?.data === undefined) {
    throw new Error("Format backup tidak valid");
  }
  return parsed;
};
