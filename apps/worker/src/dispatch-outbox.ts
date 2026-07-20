import { OutboxDispatcher, PrismaOutboxDispatchPort } from "./outbox-dispatcher.js";

const limit = Number(process.env.OUTBOX_DISPATCH_LIMIT ?? 25);
const port = new PrismaOutboxDispatchPort();

try {
  const result = await new OutboxDispatcher(port).dispatchBatch(limit);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await port.disconnect();
}
