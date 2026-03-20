'use client';

import { createContext, useContext, useState } from 'react';

type LogType = {
  message: string;
  color: string;
};

export type LogContextType = {
  logs: Array<LogType>;
  // eslint-disable-next-line no-unused-vars
  setLogs: (ll: Array<LogType>) => void;
  // eslint-disable-next-line no-unused-vars
  appendLogs: (log: string, color?: string) => void;
};

const LogContext = createContext<LogContextType | null>(null);

export const LogContextProvider = ({ children }: any) => {
  const [logs, setLogs] = useState<Array<LogType>>([]);

  const appendLogs = (newLog: string, color: string = 'black') => {
    setLogs((existingLogs) => [...existingLogs, { message: newLog, color }]);
    // eslint-disable-next-line no-console
    console.log(newLog);
  };

  return <LogContext.Provider value={{ logs, setLogs, appendLogs }}>{children}</LogContext.Provider>;
};

export const useLogContext = () => useContext(LogContext);
