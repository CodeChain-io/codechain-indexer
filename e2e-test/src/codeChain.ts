import * as assert from "assert";
import { SDK } from "codechain-sdk";
import * as Docker from "dockerode";
import * as cleanUp from "./cleanUp";
import { logger } from "./logger";

const codechainImage =
  "kodebox/codechain:bbf16b0be43bdee3da7aef55bd2721c835a298a0";

const delay = (num: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, num);
  });
};

export class CodeChain {
  private docker: Docker;
  private container: Docker.Container | null;
  private sdk: SDK;
  private cleanupToken: cleanUp.Token | null = null;
  private port: number;

  constructor(port: number = 8080) {
    this.port = port;
    this.docker = new Docker();
    this.container = null;
    this.sdk = new SDK({
      server: `http://localhost:${port}`,
      keyStoreType: "memory"
    });
  }

  public async run(): Promise<void> {
    assert(this.container === null);
    logger.info("Pull docker image");
    await this.pullImage();

    logger.info("Create container");
    this.container = await this.docker.createContainer({
      Image: codechainImage,
      Cmd: [
        "--jsonrpc-interface",
        "0.0.0.0",
        "--jsonrpc-port",
        String(this.port),
        "-c",
        "solo",
        "--reseal-min-period",
        "0",
        "--enable-devel-api"
      ],
      ExposedPorts: { [`${this.port}/tcp`]: {} },
      HostConfig: {
        PortBindings: {
          [`${this.port}/tcp`]: [
            {
              HostPort: String(this.port)
            }
          ]
        }
      }
    });
    logger.debug("Start container");
    await this.container.start();

    this.cleanupToken = cleanUp.register(this.stop);

    while (true) {
      try {
        await delay(500);
        logger.silly("Ping to CodeChain");
        await this.sdk.rpc.node.ping();
        break;
      } catch (err) {
        logger.silly(`Ping to CodeChain failed ${err}`);
      }
    }
  }

  public stop = async () => {
    if (this.cleanupToken) {
      cleanUp.deRegister(this.cleanupToken!);
      this.cleanupToken = null;
    }
    if (this.container !== null) {
      const container = this.container;
      this.container = null;
      logger.debug("Stop CodeChain docker container;");
      await container.stop();
      logger.debug("Remove CodeChain docker container;");
      await container.remove();
    }
  };

  public async pullImage(): Promise<void> {
    await new Promise((resolve, reject) => {
      this.docker.pull(codechainImage, {}, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        this.docker.modem.followProgress(stream, onFinished, onProgress);

        function onFinished(finishedErr: any) {
          if (finishedErr) {
            reject(finishedErr);
            return;
          }

          resolve();
        }

        function onProgress(event: any) {
          logger.silly("", event);
        }
      });
    });
  }
}
