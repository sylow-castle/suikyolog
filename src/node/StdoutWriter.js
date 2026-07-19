import { stderr, stdout } from "node:process";
import { Transporter } from "../core/Transporter.js";
import { Writer } from "../core/Writer.js";
import { TransporterBuilder } from "../core/TransporterBuilder.js";
import { SyslogEncoder } from "../core/SyslogEncoder.js";

/**
 * 標準出力をするトランスポーター
 */
export class StdoutWriter extends Writer {
  /**
   * 標準出力に書き込む
   * @override
   * @async
   * @param {string} frame
   * @throw Error 標準出力でエラーが発生した場合
   */
  write(frame) {
    stdout.write(frame + "\n");
  }
}

/**
 * 標準エラー出力をするトランスポーター
 */
export class StderrWriter extends Writer {
  /**
   * 標準エラーに書き込む
   * @override
   * @async
   * @param {string} frame
   * @throw Error 標準出力でエラーが発生した場合
   */
  write(frame) {
    stderr.write(frame + "\n");
  }
}

/**
 * エラー以上を標準エラー出力にそれ以外を標準出力に書き込む
 */
export class PosixWriter {
  static create() {
    return TransporterBuilder.start(7)
      .fanout(f => 
        f.add(TransporterBuilder
          .start(3)
          .encodedBy(new SyslogEncoder())
          .write(new StderrWriter())
          .end()
        ).add(TransporterBuilder
          .start(7)
          .filter(stmt => (stmt.pri % 8) > 3)
          .encodedBy(new SyslogEncoder())
          .write(new StdoutWriter())
          .end()
        )
    ).end();
  }
}