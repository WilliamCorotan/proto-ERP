import { Queue, Worker } from "bullmq";
import { accountingManifest } from "@erp/accounting";
import { createDefaultRegistry } from "@erp/core";
import { inventoryManifest } from "@erp/inventory";
import { integrationManifest } from "@erp/integration";
import { manufacturingManifest } from "@erp/manufacturing";
import { operationsManifest } from "@erp/operations";
import { procurementManifest } from "@erp/procurement";
import { qualityManifest } from "@erp/quality";
import { reportingManifest } from "@erp/reporting";
import { salesManifest } from "@erp/sales";
import { OutboxDispatcher, PrismaOutboxDispatchPort } from "./outbox-dispatcher.js";

const registry = createDefaultRegistry([
  salesManifest,
  accountingManifest,
  procurementManifest,
  inventoryManifest,
  manufacturingManifest,
  qualityManifest,
  reportingManifest,
  integrationManifest,
  operationsManifest
]);
const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379"
};

async function startWorker() {
  const queue = new Queue("erp-automation", { connection });
  await queue.add(
    "core.module-audit",
    {
      modules: registry.list().map((module) => module.id),
      checkedAt: new Date().toISOString()
    },
    {
      repeat: { pattern: "*/15 * * * *" },
      removeOnComplete: 100
    }
  );
  await queue.add(
    "integration.outbox-dispatch",
    {
      job: "dispatch-pending-outbox-events",
      checkedAt: new Date().toISOString()
    },
    {
      repeat: { pattern: "*/5 * * * *" },
      removeOnComplete: 100
    }
  );

  new Worker(
    "erp-automation",
    async (job) => {
      if (job.name === "integration.outbox-dispatch") {
        const port = new PrismaOutboxDispatchPort();
        try {
          const result = await new OutboxDispatcher(port).dispatchBatch();
          console.log(`Processed ${job.name}`, result);
          return result;
        } finally {
          await port.disconnect();
        }
      }
      console.log(`Processed ${job.name}`, job.data);
      return job.data;
    },
    { connection }
  );

  console.log("ERP worker listening for automation jobs.");
}

startWorker().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
