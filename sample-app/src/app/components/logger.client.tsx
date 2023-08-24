'use client';

import React, { useEffect, useRef } from 'react';
import { useLogContext } from '@/lib/log-context';

const Logger = (): React.JSX.Element => {
  // @ts-ignore
  const { logs, setLogs } = useLogContext();
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    // @ts-ignore
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  return (
    <div>
      <div className="flex border bg-gray-50 border-gray-300 p-2 rounded-sm justify-between items-center">
        <div>Logs</div>
        <button
          onClick={handleClearLogs}
          className="bg-white enabled:hover:bg-[#ebf4ff] enable:hover:text-[#030b5d] font-medium text-[#121c2d] py-2 px-4 rounded border-[1px] border-gray-500 enabled:hover:border-[#121c2d]"
        >
          Clear logs
        </button>
      </div>

      <div className="break-words border-2 border-t-0 border-[#e1e3ea] p-2 h-[440px] overflow-x-auto">
        {logs.map(({ message, color }: { message: string; color: string }, index: number) => (
          <div
            key={`log-${index}`}
            className={`border-b-2 border-[#e1e3ea] p-1 ${color === 'green' ? 'text-green-600' : ''} ${
              color === 'red' ? 'text-[#d6201f]' : ''
            }`}
          >
            {message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Logger;
