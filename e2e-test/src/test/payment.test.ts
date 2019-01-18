import * as assert from "assert";
import "mocha";
import { CodeChain } from "../codeChain";
import { loadData } from "../db";
import { Index } from "../indexer";

describe("Payment", function() {
  const indexer: Index = new Index();
  /// We start an empty CodeChain because the Indexer needs it.
  const codeChain: CodeChain = new CodeChain();
  before(async function() {
    this.timeout(20 * 1000);
    await Promise.all([
      codeChain.run(),
      (async () => {
        await indexer.dbReset();
        await loadData("payment");
      })()
    ]);

    await indexer.start();
  });

  after(async function() {
    await indexer.stop();
    await codeChain.stop();
  });

  it("Payment transaction should be exist", async function() {
    const transactions = await indexer.rpc.getTx({
      name: "d1dffb192188b2d55ed5e05ace6998a73a6a1920878f6175b163a8d80df24e53"
    });
    assert(parseInt(transactions[0].pay.quantity, 10) > 0);
  });
});
