import { spawn } from "node:child_process";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const previewDirectory = resolve("src/app/workspace-preview");
const previewFile = resolve(previewDirectory, "page.tsx");
const port = process.env.UI_TEST_PORT || "3014";
const url = `http://localhost:${port}/workspace-preview`;
await mkdir(previewDirectory, { recursive: true });
// Never overwrite an existing route. Only this temporary fixture is removed.
await copyFile(resolve("scripts/fixtures/workspace.tsx"), previewFile, constants.COPYFILE_EXCL);
let server;
try {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", port], { stdio: "inherit", windowsHide: true });
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server.exitCode !== null) throw new Error("Preview server exited before becoming ready.");
    try { const response = await fetch(url, { signal: AbortSignal.timeout(2000) }); if (response.ok) { ready = true; break; } } catch { /* Wait for compilation. */ }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error("Preview server did not become ready.");
  const result = await new Promise((resolve, reject) => {
    const test = spawn(process.execPath, ["scripts/ui-smoke.mjs"], { env: { ...process.env, UI_TEST_URL: url }, stdio: "inherit", windowsHide: true });
    test.on("error", reject); test.on("exit", resolve);
  });
  if (result !== 0) process.exitCode = 1;
} finally {
  // Next dev owns a worker process on Windows; taskkill is limited to the
  // specific server PID started above. No unrelated node processes are touched.
  if (server && server.exitCode === null) {
    if (process.platform === "win32") await new Promise((resolve) => {
      spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true }).on("exit", resolve);
    });
    else server.kill("SIGTERM");
  }
  await rm(previewFile);
  // The temporary route must not survive in Next's generated dev validators.
  // Next regenerates these files when the development server starts again.
  await rm(resolve(".next/dev/types/validator.ts"), { force: true });
  await rm(resolve(".next/dev/types/routes.d.ts"), { force: true });
}
