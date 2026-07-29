import { copyFile, writeFile } from "node:fs/promises";

const generatedWorker = ".open-next/worker.js";
const nextWorker = ".open-next/next-worker.js";

await copyFile(generatedWorker, nextWorker);

await writeFile(
  generatedWorker,
  `import handler from "./next-worker.js";

export { DOQueueHandler, DOShardedTagCache } from "./next-worker.js";

export default {
  fetch: handler.fetch,

  async scheduled(event, env, context) {
    if (!env.CRON_SECRET) {
      throw new Error("CRON_SECRET is not configured.");
    }

    const response = await handler.fetch(
      new Request("https://internal.bhada/api/cron/rent-bills", {
        method: "POST",
        headers: {
          authorization: \`Bearer \${env.CRON_SECRET}\`,
          "x-scheduled-time": String(event.scheduledTime),
        },
      }),
      env,
      context,
    );

    if (!response.ok) {
      throw new Error(\`Monthly rent billing failed with status \${response.status}.\`);
    }
  },
};
`,
);
