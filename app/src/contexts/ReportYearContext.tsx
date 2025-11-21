import { createContext, ReactNode, useContext } from 'react';

interface ReportYearContextValue {
  year: string | null;
}

const ReportYearContext = createContext<ReportYearContextValue | undefined>(undefined);

interface ReportYearProviderProps {
  year: string | null;
  children: ReactNode;
}

export function ReportYearProvider({ year, children }: ReportYearProviderProps) {
  return <ReportYearContext.Provider value={{ year }}>{children}</ReportYearContext.Provider>;
}

export function useReportYearContext(): string | null {
  const context = useContext(ReportYearContext);
  if (context === undefined) {
    // Not inside a ReportYearProvider - return null to indicate no year available
    return null;
  }
  return context.year;
}
