"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface PendingConfirm extends Required<ConfirmOptions> {
  resolve: (confirmed: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [activeRequest, setActiveRequest] = useState<PendingConfirm | null>(null);
  const activeRequestRef = useRef<PendingConfirm | null>(null);
  const queueRef = useRef<PendingConfirm[]>([]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const request: PendingConfirm = {
        ...options,
        confirmLabel: options.confirmLabel ?? "Confirm",
        cancelLabel: options.cancelLabel ?? "Cancel",
        resolve,
      };

      if (activeRequestRef.current) {
        queueRef.current.push(request);
        return;
      }

      activeRequestRef.current = request;
      setActiveRequest(request);
    });
  }, []);

  const finish = useCallback((confirmed: boolean) => {
    const currentRequest = activeRequestRef.current;
    if (!currentRequest) return;

    currentRequest.resolve(confirmed);
    const nextRequest = queueRef.current.shift() ?? null;
    activeRequestRef.current = nextRequest;
    setActiveRequest(nextRequest);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={activeRequest !== null}
        title={activeRequest?.title ?? ""}
        message={activeRequest?.message ?? ""}
        confirmLabel={activeRequest?.confirmLabel ?? "Confirm"}
        cancelLabel={activeRequest?.cancelLabel ?? "Cancel"}
        onConfirm={() => finish(true)}
        onCancel={() => finish(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}
