import { bench, describe } from 'vitest'
import { SyslogEncoder } from '../src/core/SyslogEncoder.js'
import { ConsoleLogger } from '../src/core/ConsoleLogger.js'
import { TransporterBuilder } from '../src/core/TransporterBuilder.js'
import { NullWriter } from '../src/core/Writer'
import { NullTransporter } from '../src/core/NullTransporter.js'
import { MemoryWriter } from '../src/core/MemoryWriter.js'


describe('Syslogエンコードのベンチ', () => {
  const TARGET_COUNT = 10000

  // 単一のベンチマークケース
  bench('1万件のログ生成', () => {
    const writer = new MemoryWriter({});
    const logger = new ConsoleLogger(TransporterBuilder.start(7)
      .encodedBy(new SyslogEncoder())
      .write(writer)
      .end());
    for (let i = 0; i < TARGET_COUNT; i++) {
      logger.info("bench " + i);
    }
    console.log(writer.getLogs.length);

  }, {
    time: 1000
  })
})