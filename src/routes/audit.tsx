import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Building2,
  FileText,
  Activity,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/components/session-context";
import { apiKotama, type AuditLogItem } from "@/lib/api";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Log Audit Pengawasan — SISKOPAD Sistem Koperasi TNI AD" },
      {
        name: "description",
        content: "Rekam jejak dan log aktivitas pengawasan Kotama TNI AD.",
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { kotama } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const {
    data: logs = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["kotama-audit-logs-full"],
    queryFn: () => apiKotama.getAuditLogs(),
    refetchInterval: 10000,
  });

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.satminkalId && log.satminkalId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction =
      actionFilter === "ALL" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("MONITORING_START")) {
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px]">MONITORING_START</Badge>;
    }
    if (action.includes("MONITORING_END")) {
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-[10px]">MONITORING_END</Badge>;
    }
    if (action.includes("CREATE")) {
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]">{action}</Badge>;
    }
    if (action.includes("DELETE") || action.includes("REJECT")) {
      return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/30 text-[10px]">{action}</Badge>;
    }
    return <Badge variant="outline" className="text-[10px] font-mono">{action}</Badge>;
  };

  const formatAuditDetails = (details: any, defaultText: string = "-"): string => {
    if (!details) return defaultText;
    if (typeof details === "string") return details;
    if (typeof details === "object") {
      if (details.catatan) {
        if (details.satminkalNama) {
          return `${details.catatan} (${details.satminkalNama})`;
        }
        return String(details.catatan);
      }
      if (details.satminkalNama) {
        return `Satminkal: ${details.satminkalNama}${details.satminkalKode ? ` (${details.satminkalKode})` : ""}`;
      }
      if (details.message) {
        return String(details.message);
      }
      try {
        return JSON.stringify(details);
      } catch {
        return defaultText;
      }
    }
    return String(details);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Audit &amp; Rekam Jejak Pengawasan"
        description={`Audit trail kepatuhan dan histori aktivitas sistem di tingkat ${kotama}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-9"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Perbarui Log
          </Button>
        }
      />

      {/* Filter Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari aktivitas, admin, atau satminkal..."
                className="h-9 pl-9 text-xs rounded-lg"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-9 w-44 text-xs">
                <SelectValue placeholder="Semua Tipe Aksi" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="ALL">Semua Tipe Aksi</SelectItem>
                <SelectItem value="MONITORING_START">Monitoring Dimulai</SelectItem>
                <SelectItem value="MONITORING_END">Monitoring Berakhir</SelectItem>
                <SelectItem value="CREATE_SATMINKAL">Tambah Satminkal</SelectItem>
                <SelectItem value="UPDATE_SATMINKAL">Update Satminkal</SelectItem>
                <SelectItem value="LOGIN">Autentikasi / Login</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Menampilkan <strong>{filteredLogs.length}</strong> dari {logs.length} catatan
          </div>
        </CardContent>
      </Card>

      {/* Table of Audit Logs */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Histori Aktivitas &amp; Pengawasan
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Catatan permanen waktu, aktor, target satminkal, dan rincian perubahan data.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-center text-xs font-bold">No</TableHead>
                  <TableHead className="text-xs font-bold">Waktu</TableHead>
                  <TableHead className="text-xs font-bold">Aksi</TableHead>
                  <TableHead className="text-xs font-bold">User / Aktor</TableHead>
                  <TableHead className="text-xs font-bold">Satminkal Target</TableHead>
                  <TableHead className="text-xs font-bold">Rincian Aktivitas</TableHead>
                  <TableHead className="text-right text-xs font-bold">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                      {isLoading ? "Memuat log aktivitas..." : "Tidak ada catatan audit yang sesuai kriteria."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors text-xs">
                      <TableCell className="text-center text-muted-foreground font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{new Date(log.timestamp).toLocaleString("id-ID")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground">{log.username || "Admin"}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {log.role || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {log.satminkalId || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-foreground text-xs">{formatAuditDetails(log.details)}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] text-muted-foreground">
                        {"127.0.0.1"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
