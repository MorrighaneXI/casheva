import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ROLES,
  ROLE_PROFILES,
  loanApplications,
  type LoanApp,
  type LoanStage,
  type Role,
} from "@/lib/casheva-data";

type SessionCtx = {
  role: Role;
  setRole: (r: Role) => void;
  profile: (typeof ROLE_PROFILES)[Role];
  satminkal: string;
  kotama: string;
  loans: LoanApp[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  screenLoan: (id: string, eligible: boolean, note: string) => void;
  recommendLoan: (id: string, approve: boolean, note: string) => void;
  finalApprove: (id: string, approve: boolean, note: string) => void;
  toggleDoc: (id: string, doc: string) => void;
  disburse: (id: string) => string;
  pendingFor: (role: Role) => number;
};

const Ctx = createContext<SessionCtx | null>(null);

let invoiceSeq = 1;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(ROLES[0]);
  const [loans, setLoans] = useState<LoanApp[]>(loanApplications);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const patch = useCallback((id: string, next: Partial<LoanApp>) => {
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, ...next } : l)));
  }, []);

  const screenLoan = useCallback(
    (id: string, eligible: boolean, note: string) =>
      patch(id, {
        stage: (eligible ? 3 : 2) as LoanStage,
        rejected: !eligible,
        catatanJurbay: note,
      }),
    [patch],
  );

  const recommendLoan = useCallback(
    (id: string, approve: boolean, note: string) =>
      patch(id, {
        stage: (approve ? 4 : 3) as LoanStage,
        rejected: !approve,
        catatanPimpinan: note,
      }),
    [patch],
  );

  const finalApprove = useCallback(
    (id: string, approve: boolean, note: string) =>
      patch(id, {
        stage: (approve ? 5 : 4) as LoanStage,
        rejected: !approve,
        catatanKaprim: note,
      }),
    [patch],
  );

  const toggleDoc = useCallback((id: string, doc: string) => {
    setLoans((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              docs: l.docs.includes(doc)
                ? l.docs.filter((d) => d !== doc)
                : [...l.docs, doc],
            }
          : l,
      ),
    );
  }, []);

  const disburse = useCallback(
    (id: string) => {
      const invoice = `#INV${250617}${String(1000 + invoiceSeq++).slice(-4)}`;
      patch(id, { stage: 7 as LoanStage, invoice });
      return invoice;
    },
    [patch],
  );

  const pendingFor = useCallback(
    (r: Role) => {
      const active = loans.filter((l) => !l.rejected);
      if (r === "Juru Bayar") return active.filter((l) => l.stage === 2).length;
      if (r === "Dan/Ka") return active.filter((l) => l.stage === 3).length;
      if (r === "Kaprim") return active.filter((l) => l.stage === 4).length;
      return active.filter((l) => l.stage === 5 || l.stage === 6).length;
    },
    [loans],
  );

  const value = useMemo<SessionCtx>(
    () => ({
      role,
      setRole,
      profile: ROLE_PROFILES[role],
      satminkal: "Disinfolahtad",
      kotama: "Mabesad",
      loans,
      selectedId,
      setSelectedId,
      screenLoan,
      recommendLoan,
      finalApprove,
      toggleDoc,
      disburse,
      pendingFor,
    }),
    [
      role,
      loans,
      selectedId,
      screenLoan,
      recommendLoan,
      finalApprove,
      toggleDoc,
      disburse,
      pendingFor,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
