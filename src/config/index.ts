import * as dotenv from "dotenv";

// Read and load `.env` file into `process.env`
dotenv.config();

export default {
    elasticSearch: {
        host: process.env.ELASTICSEARCH_HOST || "http://localhost:9200"
    },
    codeChain: {
        host: process.env.CODECHAIN_HOST || "http://localhost:8080",
        networkId: process.env.CODECHAIN_NETWORK_ID || "tc"
    },
    miningReward: {
        solo: 0,
        husky: 10000000000,
        saluki: 1000000000
    },
    genesisAddressList: {
        solo: [
            "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqyca3rwt",
            "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgfrhflv",
            "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvxf40sk",
            "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqszkma5z",
            "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5duemmc",
            "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqcuzl32l",
            "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqungah99",
            "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqc2ul2h",
            "tccq8vapdlstar6ghmqgczp6j2e83njsqq0tsvaxm9u",
            "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd"
        ],
        husky: ["tccqynz79luhx4cfakvcqe29rwaajnkzz6aev5deztu"],
        saluki: ["sccqx74ftz8ct6yks4mq3u06g2wt07zxfqrss777pj2"]
    },
    cron: {
        blockWatch: "*/5 * * * * *"
    }
};
