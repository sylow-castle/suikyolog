import { describe, test, expect } from "vitest"
import { FetchWriter } from "../src/core/FetchWriter.js";
import * as EventType from "../src/core/EventType.js";

describe.only("FetchWriterクラスのテスト", () => {
  test("HTTP経由でのログ送信（成功ケース）", async () => {
    const url = "http://localhost:30080/log";
    const writer = new FetchWriter(url);
    writer.setEventTarget(new EventTarget());
    const logData = "test message";

    // イベントハンドラを設定
    const received = [];
    const error = [];
    writer._getEventTarget().addEventListener(EventType.ERROR, (e) => error.push(e));
    writer._getEventTarget().addEventListener(EventType.WRITTEN, (e) => received.push((e as CustomEvent).detail));

    // ログを書き込む
    writer.write(logData);

    // 通常のWriterはflushを待たずに終了するので、すぐに閉じても良い
    writer.close();

    // ネットワーク操作なので、少し待ってから結果を確認する
    // (実際のサーバー応答は同期的に待機するわけではないが、テストの性質上少し待つ)
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(received.length).toBe(1);
    // 成功ケースなのでエラーは来ていないはず
    expect(error.length).toBe(0);
  });
});
