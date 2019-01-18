import { writeFileSync } from "fs";
import * as path from "path";
import { CodeChain } from "../src/codeChain";
import { dumpData } from "../src/db";
import { waitIndexer } from "../src/indexer";
import { logger } from "../src/logger";
import { runExamplesWithSetup } from "../src/sdkExample";

const fixtures = [
  {
    name: "payment",
    examples: ["send-tx"]
  }
]

const main = async (): Promise<void> => {
  const codeChain = new CodeChain();

  for (const fixture of fixtures) {
    try {
      logger.info(`Create ${fixture.name} with ${JSON.stringify(fixture.examples)}`);
      await codeChain.run();
      await runExamplesWithSetup(fixture.examples);
      await waitIndexer();
      await codeChain.stop();
      const dataSQL = await dumpData();

      writeFileSync(path.join(__dirname, "..", `sqls/${fixture.name}.sql`), dataSQL);
    } catch (err) {
      await codeChain.stop();
      throw err;
    }
  }
};

main().catch(console.error);
