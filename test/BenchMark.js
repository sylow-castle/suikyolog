import { ConsoleLogger } from "../src/ConsoleLogger.js";
import { SyslogEncoder } from "../src/SyslogEncoder.js";
import { SimpleEncoder } from "../src/SimpleEncoder.js";
import { SyslogStmt } from "../src/SyslogStmt.js";
import { MutableStructuredData } from "../src/MutableStructuredData.js";
import { MemoryTransporter } from "../src/MemoryTransporter.js";

const stmt = new SyslogStmt().gen("test");
const encoder = new SyslogEncoder();
const logger = new ConsoleLogger(new MemoryTransporter()).level(7).onError(err => {
  console.log(err);
});

const VOLUME = 100000;
const startTime = performance.now();
const structuredData = new MutableStructuredData();
structuredData.add("testSdId", "testKey", "testValue")
  .add("testSdId", "testKey2", "testValue")
  .add("testSdId2", "testKey2", "testValue");


for (let i = 0; i < VOLUME; i++) {
  const stmt = new SyslogStmt().gen(`test_${i}`).sd(structuredData);
  logger.info(stmt);
}
const endTime = performance.now();
console.log(`Time: ${endTime - startTime}`);
