import React from 'react';
import { AuditData, getRefreshInterval, usePolarisData } from './polaris';

interface PolarisDataContextValue {
  data: AuditData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const PolarisDataContext = React.createContext<PolarisDataContextValue | null>(null);

export function PolarisDataProvider(props: { children: React.ReactNode }) {
  const interval = getRefreshInterval();
  const state = usePolarisData(interval);

  // Rename triggerRefresh to refresh for consistency
  const value = React.useMemo(
    () => ({
      data: state.data,
      loading: state.loading,
      error: state.error,
      refresh: state.triggerRefresh,
    }),
    [state]
  );

  return <PolarisDataContext.Provider value={value}>{props.children}</PolarisDataContext.Provider>;
}

export function usePolarisDataContext(): PolarisDataContextValue {
  const ctx = React.useContext(PolarisDataContext);
  if (ctx === null) {
    throw new Error('usePolarisDataContext must be used within a PolarisDataProvider');
  }
  return ctx;
}
