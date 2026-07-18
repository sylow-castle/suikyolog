import { ConsoleLogger } from "../src/core/ConsoleLogger.js";
import { SyslogEncoder } from "../src/core/SyslogEncoder.js";
import { SimpleEncoder } from "../src/core/SimpleEncoder.js";
import { SyslogStmt } from "../src/core/SyslogStmt.js";
import { MutableStructuredData } from "../src/core/StructuredData.js";
import { MemoryTransporter } from "../src/core/MemoryTransporter.js";

const stmt = new SyslogStmt().gen("test");
const encoder = new SyslogEncoder();
const logger = new ConsoleLogger(new MemoryTransporter()).level(7).onError(err => {
  console.log(err);
});

const VOLUME = 100000;
const startTime = performance.now();
let structuredData = new MutableStructuredData();
structuredData.add("testSdId", "testKey", "testValue")
  .add("testSdId", "testKey2", "testValue")
  .add("testSdId2", "testKey2", "testValue");
structuredData = structuredData.freeze();

for (let i = 0; i < VOLUME; i++) {
  const stmt = new SyslogStmt().gen(`test_${i}`).sd(structuredData);
  logger.info(stmt);
}
const endTime = performance.now();
console.log(`Time: ${endTime - startTime}`);
