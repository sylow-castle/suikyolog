import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest"
import { createServer, Server } from "node:http";
import { FetchWriter } from "../src/core/FetchWriter.js";
import * as EventType from "../src/core/EventType.js";
import { TransporterBuilder } from "../src/core/TransporterBuilder.js";
import { SyslogEncoder } from "../src/core/SyslogEncoder.js";
import { Logger } from "../src/core/Logger.js";
import { AddressInfo } from "node:net";

let SERVER: Server = null;
let URL: string = `http://localhost`;
let receivedLogs: string[] = [];


async function startMockServer() {
  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/log") {
      const chunks = [];

      req.on("data", (chunk) => chunks.push(chunk));

      req.on("end", () => {
        const bodyText = Buffer.concat(chunks).toString("utf-8");
        receivedLogs.push(bodyText);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", receivedLength: bodyText.length }));
      });
    } else {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
    }
  });

  return new Promise<{ server: Server; url: string }>((resolve, reject) => {
    server.listen(0, () => {
      const addr = server.address() as AddressInfo;
      const url = `http://localhost:${addr.port}`;
      resolve({ server, url });
    });
    server.on("error", (err) => reject(err))
  });
}

beforeAll(async () => {
  const { server, url } = await startMockServer();
  SERVER = server;
  URL = url;

});

beforeEach(() => {
  receivedLogs = [];
});

afterEach(() => {
  receivedLogs = null;
});

afterAll(() => {
  SERVER.close();
})

describe("FetchWriterクラスのテスト", () => {
  test("HTTP経由でのログ送信（成功ケース）", async () => {
    const logger = new Logger(TransporterBuilder.start(7)
      .encodedBy(new SyslogEncoder())
      .write(new FetchWriter(URL + "/log"))
      .end()
    );

    // イベントハンドラを設定
    const received = [];
    const error = [];
    logger.addEventListener(EventType.ERROR, (e) => error.push(e));
    logger.addEventListener(EventType.WRITTEN, (e) => received.push((e as CustomEvent).detail));

    logger.info("test message");
    logger.close();

    // ネットワーク操作なので、少し待ってから結果を確認する
    // (実際のサーバー応答は同期的に待機するわけではないが、テストの性質上少し待つ)
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(received.length).toBe(1);

    // 成功ケースなのでエラーは来ていないはず
    expect(error.length).toBe(0);
  });

  test("HTTP経由でのログ送信（失敗ケース）", async () => {
    const logger = new Logger(TransporterBuilder.start(7)
      .encodedBy(new SyslogEncoder())
      .write(new FetchWriter(URL + "/fail"))
      .end()
    );

    // イベントハンドラを設定
    const received = [];
    const error = [];
    logger.addEventListener(EventType.ERROR, (e) => error.push(e));
    logger.addEventListener(EventType.WRITTEN, (e) => received.push((e as CustomEvent).detail));

    logger.info("test message");
    logger.close();

    // ネットワーク操作なので、少し待ってから結果を確認する
    // (実際のサーバー応答は同期的に待機するわけではないが、テストの性質上少し待つ)
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(received.length).toBe(0);

    // 失敗ケースなのでエラーは来ていないはず
    expect(error.length).toBe(1);
  });

});
