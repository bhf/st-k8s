"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface RefreshContextType {
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  interval: number;
  setInterval: (val: number) => void;
  lastUpdated: Date | null;
  setLastUpdated: (date: Date) => void;
  triggerRefresh: number;
  refresh: () => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [autoRefresh, setAutoRefreshState] = useState<boolean>(false);
  const [interval, setIntervalState] = useState<number>(30); // Default 30s
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [triggerRefresh, setTriggerRefresh] = useState<number>(0);

  // Load from localStorage on mount
  useEffect(() => {
    const savedAutoRefresh = localStorage.getItem('k8s-auto-refresh');
    const savedInterval = localStorage.getItem('k8s-refresh-interval');

    if (savedAutoRefresh !== null) {
      setAutoRefreshState(savedAutoRefresh === 'true');
    }
    if (savedInterval !== null) {
      setIntervalState(parseInt(savedInterval, 10));
    }
  }, []);

  const setAutoRefresh = useCallback((val: boolean) => {
    setAutoRefreshState(val);
    localStorage.setItem('k8s-auto-refresh', String(val));
  }, []);

  const setInterval = useCallback((val: number) => {
    setIntervalState(val);
    localStorage.setItem('k8s-refresh-interval', String(val));
  }, []);

  const refresh = useCallback(() => {
    setTriggerRefresh(prev => prev + 1);
    setLastUpdated(new Date());
  }, []);

  const contextValue = useMemo(() => ({
    autoRefresh,
    setAutoRefresh,
    interval,
    setInterval,
    lastUpdated,
    setLastUpdated,
    triggerRefresh,
    refresh
  }), [autoRefresh, setAutoRefresh, interval, setInterval, lastUpdated, triggerRefresh, refresh]);

  return (
    <RefreshContext.Provider value={contextValue}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}
