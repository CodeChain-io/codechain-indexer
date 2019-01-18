import { CodeChain } from "../src/codeChain";

const main = async (): Promise<void> => {
    const codeChain = new CodeChain();
    try {
        await codeChain.pullImage();
    } catch (err) {
        await codeChain.stop();
        throw err;
    }
};

main().catch(console.error);
