import React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

export interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning" | "success";
  icon?: React.ReactNode;
  isLoading?: boolean;
  details?: { label: string; value: string | React.ReactNode }[];
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  variant = "default",
  icon,
  isLoading = false,
  details = [],
}: ConfirmActionDialogProps) {
  const getIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case "destructive":
        return <AlertCircle className="size-6 text-destructive" />;
      case "warning":
        return <AlertTriangle className="size-6 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <HelpCircle className="size-6 text-primary" />;
    }
  };

  const getHeaderBg = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "warning":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "success":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      default:
        return "bg-primary-soft text-primary border-primary/20";
    }
  };

  const getButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "warning":
        return "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600";
      case "success":
        return "bg-emerald-600 text-white hover:bg-emerald-700";
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className={`grid size-11 shrink-0 place-items-center rounded-xl border ${getHeaderBg()}`}>
              {getIcon()}
            </div>
            <div className="space-y-1 text-left">
              <AlertDialogTitle className="text-base font-bold leading-snug">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {details.length > 0 && (
          <div className="my-2 rounded-xl border bg-muted/40 p-3 text-xs space-y-2">
            {details.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground text-right">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading} className="text-xs h-9">
            {cancelText}
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={isLoading}
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
            }}
            className={`text-xs font-semibold h-9 gap-1.5 ${getButtonClass()}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Memproses...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
