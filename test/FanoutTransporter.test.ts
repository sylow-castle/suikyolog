import { describe, test, expect } from "vitest"
import { Logger } from "../src/core/Logger.js"
import { MemoryWriter } from "../src/core/MemoryWriter.js";
import { TransporterBuilder } from "../src/core/TransporterBuilder.js";
import { SyslogEncoder } from "../src/core/SyslogEncoder.js"

describe("FanoutTransporterクラスのテスト", () => {
  test("正常系", async () => {
    const writer1 = new MemoryWriter();
    const writer2 = new MemoryWriter();

    const logger = new Logger(TransporterBuilder.start(7)
      .fanout(fan => {
        fan.add(TransporterBuilder.start(4)
          .encodedBy(new SyslogEncoder())
          .write(writer1)
          .end());
        fan.add(TransporterBuilder.start(7)
          .encodedBy(new SyslogEncoder())
          .write(writer2)
          .end());
      }).end());

    logger.emerg("test1");
    logger.info("test2");

    expect(writer1.getLogs().length).toEqual(1);
    expect(writer2.getLogs().length).toEqual(2);

    logger.reload();
    expect(writer1.getLogs().length).toEqual(0);
    expect(writer2.getLogs().length).toEqual(0);

    logger.close();
    logger.close();
    expect(writer1.isClosed).toEqual(true);
    expect(writer2.isClosed).toEqual(true);
  });
});