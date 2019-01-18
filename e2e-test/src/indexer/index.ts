import * as assert from "assert";
import { ChildProcess, execFile, spawn } from "child_process";
import * as path from "path";
import * as cleanUp from "../cleanUp";
import { logger } from "../logger";
import { IndexerRPC } from "./rpc";
const treeKill = require("tree-kill");
const isPortReachable = require("is-port-reachable");

const delay = (num: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, num);
  });
};

export const waitIndexer = async () => {
  const index = new Index();
  try {
    await index.dbReset();
    await index.start();
    await index.waitSync();
    await index.stop();
  } catch (err) {
    index.stop();
    throw err;
  }
};

export class Index {
  public rpc: IndexerRPC = new IndexerRPC();
  private process: ChildProcess | null;
  private clearToken: cleanUp.Token | null = null;

  constructor() {
    this.process = null;
  }

  public async dbReset() {
    const indexerPath = path.join(__dirname, "../../..");
    logger.debug("Run db reset");
    return new Promise((resolve, reject) => {
      execFile(
        "yarn",
        ["run", "reset"],
        {
          cwd: indexerPath,
          env: {
            ...process.env,
            NODE_ENV: "test-int"
          }
        },
        (error, stdout, stderr) => {
          logger.silly(`DB reset stdout ${stdout}`);
          if (stderr) {
            logger.error(stderr);
          }
          if (error) {
            reject(error);
            return;
          }
          resolve();
        }
      );
    });
  }

  public async start() {
    assert(this.process === null);

    const indexerPath = path.join(__dirname, "../../..");

    logger.debug("Spawn indexer");
    this.process = spawn("yarn", ["run", "start"], {
      cwd: indexerPath,
      env: {
        ...process.env,
        NODE_ENV: "test-int"
      }
    });

    this.process.stderr.on("data", chunk => {
      logger.warn(`STDERR from indexer, ${chunk}`);
    });

    this.process.stdout.on("data", chunk => {
      logger.silly(`STDOUT from indexer, ${chunk}`);
    });

    this.process.on("error", err => {
      logger.warn(`Indexer failed with ${err}`);
    });

    this.process.on("exit", (code, signal) => {
      logger.debug(`Indexer process exit(${code}) with signal(${signal})`);
      this.process = null;
    });

    this.clearToken = cleanUp.register(this.stop);

    while (true) {
      const reachable = await isPortReachable(9001, { host: "localhost" });
      if (reachable || this.process === null) {
        break;
      }
      logger.silly(
        "Indexer's port(9001) is not reachable in 1 second try again"
      );
      await delay(500);
    }
  }

  public stop = async () => {
    if (this.clearToken) {
      cleanUp.deRegister(this.clearToken);
      this.clearToken = null;
    }

    if (this.process !== null) {
      logger.silly(`Kill the indexer process ${this.process.pid}`);
      const process = this.process;
      treeKill(process.pid);
      await delay(500);

      if (this.process !== null && !process.killed) {
        treeKill(process.pid, "SIGKILL");
      }
      this.process = null;
    }
  };

  public async waitSync() {
    while (true) {
      const {
        indexedBlockHash,
        codechainBestBlockHash
      } = await this.rpc.getStatusSync();
      logger.silly(
        `Call /status/sync : indexedBlockHash: ${indexedBlockHash} codechainBestBlockHash: ${codechainBestBlockHash}`
      );
      if (indexedBlockHash === codechainBestBlockHash) {
        break;
      }
      await delay(500);
    }
    logger.debug("Indexer sync complete");
    return;
  }
}
