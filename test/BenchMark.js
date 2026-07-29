import { Logger } from "../src/core/Logger.js";
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
import * as EventType from "../src/core/EventType.js";
import { BufferedWriter } from "../src/core/BufferedWriter.js";
import { SyncFileWriter } from "../src/node/SyncFileWriter.js";

let writer = new SyncFileWriter({ path: "tmp/test.txt" });
let outer = new BufferedWriter(writer, 2000, 1000, 64 * 1024)
const encoder = new SyslogEncoder();
const logger = new Logger(TransporterBuilder.start(7)
  .encodedBy(new SyslogEncoder())
  .write(outer)
  .end());
const VOLUME = 100000;
const startTime = performance.now();
let structuredData = new MutableStructuredData();
structuredData.add("testSdId", "testKey", "testValue")
  .add("testSdId", "testKey2", "testValue")
  .add("testSdId2", "testKey2", "testValue");
structuredData = structuredData.freeze();

let drainPromise = null;
logger.addEventListener(EventType.BACKPRESSURE, async (event) => {
  if (!drainPromise) {
    console.error(`wait until drain: ${performance.now()}`);
    drainPromise = event.detail.waitUntilDrain().then(() => {
      console.error(`release from backpressure: ${performance.now()}`);
      drainPromise = null;
    });
  }
});


for (let i = 0; i < VOLUME; i++) {
  if (drainPromise) {
    await drainPromise;
  }

  const stmt = new SyslogStmtBuilder().sev(3).msg(`test_${i}`).sd(structuredData).build();
  logger.info(stmt);
}

outer.close();
writer.close();
logger.close();
const endTime = performance.now();
console.log(`Time: ${endTime - startTime}`);
//console.log(writer.getLogs().length);
