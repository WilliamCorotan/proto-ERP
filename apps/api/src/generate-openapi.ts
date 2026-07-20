import "reflect-metadata";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { ApiModule } from "./main.js";
import { configureOpenApi } from "./openapi.js";

async function main() {
  const app = await NestFactory.create(ApiModule, { logger: ["error"] });
  const document = configureOpenApi(app);
  const outputPath = resolve(process.cwd(), "../../docs/openapi.json");

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();

  console.log(`OpenAPI contract written to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
