import WorkerWorkspace from './components/worker.client';
import Token from './components/token.client';

import React from 'react';
import createToken from '@/lib/get-token';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: {
    accountSid?: string;
    signingKeySid?: string;
    signingKeySecret?: string;
    workspaceSid?: string;
    workerSid?: string;
    identity?: string;
    environment?: string;
  };
};

export default async function Home({ searchParams }: Props) {
  const token = await createToken(
    searchParams?.accountSid || '',
    searchParams?.signingKeySid || '',
    searchParams?.signingKeySecret || '',
    searchParams?.workspaceSid || '',
    searchParams?.workerSid || '',
    searchParams?.identity || '',
    searchParams?.environment || 'stage'
  );

  return (
    <main className="flex justify-center p-10">
      <div className="w-[760px] flex-col justify-center flex">
        <Token />
        <WorkerWorkspace token={token} environment={searchParams?.environment || 'stage'} />
      </div>
    </main>
  );
}
