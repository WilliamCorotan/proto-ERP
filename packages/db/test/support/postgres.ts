import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client } from "pg";

const execFileAsync = promisify(execFile);
const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const migrationsRoot = join(packageRoot, "prisma", "migrations");
const schemaPath = join(packageRoot, "prisma", "schema.prisma");

export const migrationTempPrefix = "erp-prisma-migrations-";
const activeMigrationTemporaryRoots = new Set<string>();

export type MigrationDeploymentOptions = {
  through?: string;
};

export function activeMigrationTemporaryDirectories(): string[] {
  return [...activeMigrationTemporaryRoots];
}

export type MigratedTestDatabase = {
  databaseName: string;
  databaseUrl: string;
  dispose(): Promise<void>;
};

export async function createMigratedTestDatabase(
  options: MigrationDeploymentOptions = {},
): Promise<MigratedTestDatabase> {
  const baseDatabaseUrl = requireTestDatabaseUrl(process.env.TEST_DATABASE_URL);
  const databaseName = createDatabaseName();
  const admin = new Client({ connectionString: baseDatabaseUrl });

  try {
    await admin.connect();
    try {
      await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    } catch (error) {
      throw new Error(
        `Unable to create isolated PostgreSQL test database ${databaseName}. The TEST_DATABASE_URL user must have CREATEDB permission.`,
        { cause: error },
      );
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Unable to create isolated")
    ) {
      throw error;
    }
    throw new Error(
      `PostgreSQL integration tests require a reachable database at ${redactDatabaseUrl(baseDatabaseUrl)}.`,
      { cause: error },
    );
  } finally {
    await safelyCloseClient(admin);
  }

  const databaseUrl = replaceDatabaseName(baseDatabaseUrl, databaseName);
  let disposed = false;
  let disposeInFlight: Promise<void> | undefined;

  const disposeOnce = async () => {
    if (disposed) return;

    const cleanup = new Client({ connectionString: baseDatabaseUrl });
    try {
      await cleanup.connect();
      await cleanup.query(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
        [databaseName],
      );
      await cleanup.query(
        `DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`,
      );
      disposed = true;
    } finally {
      await safelyCloseClient(cleanup);
    }
  };

  const dispose = async () => {
    if (disposed) return;
    disposeInFlight ??= disposeOnce().finally(() => {
      disposeInFlight = undefined;
    });
    await disposeInFlight;
  };

  try {
    await deployTestMigrations(databaseUrl, options);
  } catch (error) {
    await dispose();
    throw error;
  }

  return { databaseName, databaseUrl, dispose };
}

export async function deployTestMigrations(
  databaseUrl: string,
  options: MigrationDeploymentOptions = {},
): Promise<void> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), migrationTempPrefix));
  activeMigrationTemporaryRoots.add(temporaryRoot);
  const temporaryMigrations = join(temporaryRoot, "migrations");
  const temporarySchema = join(temporaryRoot, "schema.prisma");
  const temporaryConfig = join(temporaryRoot, "prisma.config.ts");

  try {
    await copyMigrationTree(temporaryMigrations, options.through);
    await cp(schemaPath, temporarySchema);
    await writeFile(
      temporaryConfig,
      `export default { schema: ${JSON.stringify(temporarySchema)}, migrations: { path: ${JSON.stringify(temporaryMigrations)} }, datasource: { url: process.env.DATABASE_URL } };\n`,
    );
    await runMigrationDeploy(databaseUrl, temporaryConfig);
  } finally {
    try {
      await rm(temporaryRoot, { force: true, recursive: true });
    } finally {
      activeMigrationTemporaryRoots.delete(temporaryRoot);
    }
  }
}

export function requireTestDatabaseUrl(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(
      "TEST_DATABASE_URL is required for PostgreSQL integration tests. It must identify a stable administrative database, and its user must have CREATEDB permission.",
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch (error) {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL.", {
      cause: error,
    });
  }

  if (!["postgresql:", "postgres:"].includes(url.protocol)) {
    throw new Error(
      "TEST_DATABASE_URL must use the postgresql:// or postgres:// protocol.",
    );
  }
  if (!url.hostname || !url.username) {
    throw new Error("TEST_DATABASE_URL must include a hostname and username.");
  }
  if (url.hash) {
    throw new Error("TEST_DATABASE_URL must not include a URL fragment.");
  }

  const encodedDatabaseName = url.pathname.slice(1);
  let adminDatabaseName: string;
  try {
    adminDatabaseName = decodeURIComponent(encodedDatabaseName);
  } catch (error) {
    throw new Error("TEST_DATABASE_URL contains an invalid database name.", {
      cause: error,
    });
  }
  if (
    !adminDatabaseName ||
    !/^[A-Za-z0-9_-]+$/.test(adminDatabaseName) ||
    encodedDatabaseName.includes("/")
  ) {
    throw new Error(
      "TEST_DATABASE_URL must identify one stable administrative database using a simple database name.",
    );
  }
  if (
    adminDatabaseName === "template0" ||
    adminDatabaseName === "template1" ||
    adminDatabaseName.startsWith("erp_it_")
  ) {
    throw new Error(
      "TEST_DATABASE_URL must identify a stable administrative database, not a template or generated integration-test database.",
    );
  }

  return url.toString();
}

async function copyMigrationTree(
  destination: string,
  through: string | undefined,
): Promise<void> {
  const entries = await readdir(migrationsRoot, { withFileTypes: true });
  const migrationNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (through && !migrationNames.includes(through)) {
    throw new Error(`Unknown migration cutoff: ${through}.`);
  }

  await mkdir(destination, { recursive: true });
  await cp(join(migrationsRoot, "migration_lock.toml"), join(destination, "migration_lock.toml"), {
    recursive: false,
  });
  for (const migrationName of migrationNames) {
    if (through && migrationName > through) break;
    await cp(
      join(migrationsRoot, migrationName),
      join(destination, migrationName),
      { recursive: true },
    );
  }

  const lockContents = await readFile(
    join(destination, "migration_lock.toml"),
    "utf8",
  );
  if (!lockContents.includes('provider = "postgresql"')) {
    throw new Error("Temporary migration tree has an invalid provider lock.");
  }
}

async function runMigrationDeploy(
  databaseUrl: string,
  configPath: string,
): Promise<void> {
  try {
    await execFileAsync(
      "pnpm",
      [
        "exec",
        "prisma",
        "migrate",
        "deploy",
        "--config",
        configPath,
      ],
      {
        cwd: packageRoot,
        env: { ...process.env, DATABASE_URL: databaseUrl },
        maxBuffer: 10 * 1024 * 1024,
      },
    );
  } catch (error) {
    const output = commandFailureOutput(error);
    throw new Error(
      `Prisma migrations failed for isolated database ${databaseNameFromUrl(databaseUrl)}.${output}`,
      { cause: error },
    );
  }
}

function createDatabaseName(): string {
  return `erp_it_${process.pid}_${Date.now()}_${randomUUID().replaceAll("-", "").slice(0, 8)}`;
}

function replaceDatabaseName(
  databaseUrl: string,
  databaseName: string,
): string {
  const url = new URL(databaseUrl);
  url.pathname = `/${databaseName}`;
  url.searchParams.set("schema", "public");
  return url.toString();
}

function databaseNameFromUrl(databaseUrl: string): string {
  return new URL(databaseUrl).pathname.slice(1);
}

function redactDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  if (url.password) url.password = "***";
  return url.toString();
}

function quoteIdentifier(identifier: string): string {
  if (!/^[a-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe PostgreSQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function commandFailureOutput(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const candidate = error as { stdout?: string; stderr?: string };
  const output = [candidate.stdout, candidate.stderr]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n")
    .trim();
  return output ? `\n${output}` : "";
}

async function safelyCloseClient(client: Client): Promise<void> {
  try {
    await client.end();
  } catch {
    // Preserve the connection, migration, or cleanup error that caused teardown.
  }
}
