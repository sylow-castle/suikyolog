import { Logger } from "../src/core/Logger.js";
import { SyslogEncoder } from "../src/core/SyslogEncoder.js";
import { SyslogStmtBuilder } from "../src/core/SyslogStmt.js";
import { MutableStructuredData } from "../src/core/StructuredData.js";
import { TransporterBuilder } from "../src/core/TransporterBuilder.js";
import * as EventType from "../src/core/EventType.js";
import { BufferedWriter } from "../src/core/BufferedWriter.js";
import { SyncFileWriter } from "../src/node/SyncFileWriter.js";
import { OnBackpressureWriter } from "../src/core/OnBackpressureWriter.js";

const logger = new Logger(TransporterBuilder.start(7)
  .encodedBy(new SyslogEncoder())
  .via(inner => OnBackpressureWriter.Wait(inner))
  .via(inner => new BufferedWriter(inner, { length: 2000, interval: 100, volume: 64 * 1024 }))
  .write(new SyncFileWriter({ path: "tmp/test.txt" }))
  .end());
const VOLUME = 100000;
const startTime = performance.now();
let structuredData = new MutableStructuredData();
structuredData.add("testSdId", "testKey", "testValue")
  .add("testSdId", "testKey2", "testValue")
  .add("testSdId2", "testKey2", "testValue");
structuredData = structuredData.freeze();

class BackpressureHandler {
  #drainPromise = null;

  /**
   * @param {Logger} logger
   */
  listen(logger) {
    logger.addEventListener(EventType.BACKPRESSURE, (event) => {
      if (this.#drainPromise) {
        return;
      }
      this.#drainPromise = event.detail.waitUntilDrain().then(() => {
        this.#drainPromise = null;
      });
    });
  }

  async waitIfDraining() {
    if (this.#drainPromise) {
      await this.#drainPromise;
    }
  }
}

const backpressureHandler = new BackpressureHandler();
backpressureHandler.listen(logger);

for (let i = 0; i < VOLUME; i++) {
  await backpressureHandler.waitIfDraining();

  const stmt = new SyslogStmtBuilder().sev(3).msg(`test_${i}`).sd(structuredData).build();
  logger.info(stmt);
}

//outer.close();
//writer.close();
logger.close();
const endTime = performance.now();
console.log(`Time: ${endTime - startTime}`);
//console.log(writer.getLogs().length);
