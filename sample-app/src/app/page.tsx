import WorkerWorkspace from "./components/worker.client";
import Token from "./components/token.client";

import React from "react";
import createToken from "@/lib/get-token";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const token = await createToken(
    params?.accountSid || "",
    params?.signingKeySid || "",
    params?.signingKeySecret || "",
    params?.workspaceSid || "",
    params?.workerSid || "",
    params?.identity || "",
  );

  return (
    <main className="flex justify-center p-10">
      <div className="w-[760px] flex-col justify-center flex">
        <Token />
        <WorkerWorkspace
          token={token}
          environment={params?.environment || "stage"}
        />
      </div>
    </main>
  );
}
