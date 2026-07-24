import { ConsoleLogger } from "../src/core/ConsoleLogger.js";
import { SyslogEncoder } from "../src/core/SyslogEncoder.js";
import { SimpleEncoder } from "../src/core/SimpleEncoder.js";
import { SyslogStmt, SyslogStmtBuilder } from "../src/core/SyslogStmt.js";
import { MutableStructuredData } from "../src/core/StructuredData.js";
import { MemoryWriter } from "../src/core/MemoryWriter.js";
import { PosixWriter, StdoutWriter } from "../src/node/StdoutWriter.js";
import { TransporterBuilder } from "../src/core/TransporterBuilder.js";
import { ConsoleWriter } from "../src/core/ConsoleWriter.js";
import { NullTransporter } from "../src/core/NullTransporter.js";
import { NullWriter } from "../src/core/Writer.js";
import fs from "node:fs";
import { SimpleSyncFileWriter } from "../src/node/FileWriter.js";

let writer = null;

const encoder = new SyslogEncoder();
const logger = new ConsoleLogger(TransporterBuilder.start(7)
  .encodedBy(new SyslogEncoder())
  .write(writer = new SimpleSyncFileWriter({ path: "test.txt" }))
  .end());
const VOLUME = 100000;
const startTime = performance.now();
let structuredData = new MutableStructuredData();
structuredData.add("testSdId", "testKey", "testValue")
  .add("testSdId", "testKey2", "testValue")
  .add("testSdId2", "testKey2", "testValue");
structuredData = structuredData.freeze();

for (let i = 0; i < VOLUME; i++) {
  const stmt = new SyslogStmtBuilder().sev(3).msg(`test_${i}`).sd(structuredData).build();
  logger.info(stmt);
}
writer.end();
await writer.finished();
const endTime = performance.now();
console.log(`Time: ${endTime - startTime}`);
//console.log(writer.getLogs().length);
