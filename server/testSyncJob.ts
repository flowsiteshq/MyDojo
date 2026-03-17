import "dotenv/config";
import { runDojoFlowSyncJob } from "./dojoFlowSyncJob";

console.log("=".repeat(60));
console.log("MANUAL DOJOFLOW SYNC JOB TEST");
console.log("=".repeat(60));

runDojoFlowSyncJob()
  .then(result => {
    console.log("\n" + "=".repeat(60));
    console.log("JOB COMPLETED");
    console.log("=".repeat(60));
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error("\n" + "=".repeat(60));
    console.error("JOB FAILED");
    console.error("=".repeat(60));
    console.error(error);
    process.exit(1);
  });
