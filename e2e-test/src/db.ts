import { execFile } from "child_process";
import * as path from "path";
import { logger } from "./logger";

export const dumpData = async (): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    execFile(
      "pg_dump",
      ["-T", '"SequelizeMeta"', "-a", "codechain-indexer-dev"],
      (err: any, stdout: string, stderr: string) => {
        if (stderr) {
          console.error(stderr);
        }

        if (err) {
          reject(err);
        } else {
          resolve(stdout);
        }
      }
    );
  });
};

/**
 * Load data to integration test database
 * @param dataFileName - File name in sqls directory like "payment"
 */
export const loadData = async (dataFileName: string): Promise<void> => {
  const projectPath = path.join(__dirname, "..");

  logger.silly(`Load sqls/${dataFileName}.sql file`);
  return new Promise<void>((resolve, reject) => {
    execFile(
      "psql",
      [
        "codechain-indexer-test-int",
        "-f",
        `sqls/${dataFileName}.sql`,
        "-U",
        "user",
        "-h",
        "localhost"
      ],
      {
        cwd: projectPath,
        env: {
          ...process.env,
          PGPASSWORD: "password"
        }
      },
      (err: any, _stdout: string, stderr: string) => {
        if (stderr) {
          console.error(stderr);
        }

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};
