const dotenv = require("dotenv");
const { Client } = require("elasticsearch");

// Read and load `.env` file into `process.env`
dotenv.config();

const clearIndex = async () => {
  const host = process.env.ELASTICSEARCH_HOST || "http://localhost:9200";
  const client = new Client({
    host
  });
  await client.indices.delete({
    index: "_all"
  });
  try {
    console.log("All asset images are deleted.");
  } catch (err) {
    console.error(err);
  }

  console.log("All indices are deleted.");
};
clearIndex();
