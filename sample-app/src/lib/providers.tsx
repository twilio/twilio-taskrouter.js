'use client';

import React from 'react';
import { LogContextProvider } from './log-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return <LogContextProvider>{children}</LogContextProvider>;
}
