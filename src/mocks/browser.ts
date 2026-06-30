import { setupWorker } from "msw/browser";

import { getMdriveAPIMock } from "@/api/generated/index.msw";

const worker = setupWorker(...getMdriveAPIMock());

let workerStarted = false;

export async function startWorker() {
  if (workerStarted) return;
  workerStarted = true;
  await worker.start({ onUnhandledRequest: "bypass" });
}