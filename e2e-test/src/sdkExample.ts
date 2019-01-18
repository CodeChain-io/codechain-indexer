import { execFile } from "child_process";
import { readdirSync, readFileSync, writeFile } from "fs";
import * as inquirer from "inquirer";
import * as path from "path";
import { logger } from "./logger";

process.env.NODE_ENV = "test";

export const runExamplesWithSetup = async (files: string[]) => {
  await runExample("import-test-account");

  for (const file of files) {
    await runExample(file);
  }
  logger.debug(`All examples executed`);
};

export const queryExampleFilesFromUser = async (): Promise<string[]> => {
  const dirPath = path.join(
    __dirname,
    "..",
    "node_modules/codechain-sdk/examples"
  );
  logger.debug(`Read directory ${dirPath}`);
  let files = readdirSync(dirPath);
  logger.silly(`Diretory files are ${JSON.stringify(files)}`);

  files = files
    .filter(file => {
      const filePath = path.parse(file);
      if (filePath.ext !== ".js") {
        logger.silly(`Ignore ${file}`);
        return false;
      }
      return true;
    })
    .map(file => {
      const filePath = path.parse(file);
      return filePath.name.replace(/^test-/i, "");
    });

  const { filesToRun } = await inquirer.prompt<any>({
    type: "checkbox",
    name: "filesToRun",
    choices: files,
    message: "Please give the example names"
  });

  return filesToRun;
};

const runExample = (name: string) => {
  logger.info(`Run ${name}`);
  const originalPath = path.join(
    __dirname,
    "..",
    "node_modules/codechain-sdk/",
    `examples/${name}.js`
  );
  const code = String(readFileSync(originalPath)).replace(
    `require("codechain-sdk")`,
    `require("..")`
  );
  const testPath = path.join(
    __dirname,
    "..",
    "node_modules/codechain-sdk/",
    `examples/test-${name}.js`
  );
  return new Promise((resolve, reject) => {
    writeFile(testPath, code, err => {
      if (err) {
        reject(err);
        return;
      }
      execFile("node", [testPath], (error, _stdout, stderr) => {
        if (stderr) {
          console.error(stderr);
        }
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });
};
