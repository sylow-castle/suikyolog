import { setTimeout } from "node:timers/promises";
import { describe, test, expect } from "vitest"
import { BufferedWriter } from "../src/core/BufferedWriter.js";
import { MemoryWriter } from "../src/core";

describe.only("BufferedWriterクラスのテスト", () => {
  test("時間制限（非同期）によるフラッシュ", async () => {

    const inner = new MemoryWriter();
    const writer = new BufferedWriter(inner, 100, 50, 2000);
    const et = new EventTarget();
    writer.setEventTarget(et);
    writer.write("a".repeat(1025));
    await setTimeout(100, "result");
    expect(inner.getLogs()).toStrictEqual(["a".repeat(1025)]);
    writer.close();
  });

  test("時間制限（同期）によるフラッシュ", async () => {

    const inner = new MemoryWriter();
    const nextStep = Date.now() + 60;
    const writer = new BufferedWriter(inner, 100, 50, 512);
    const et = new EventTarget();
    writer.setEventTarget(et);
    writer.write("entry 1");
    expect(inner.getLogs()).toStrictEqual([]);

    while (Date.now() < nextStep) {
      //do nothing;
    };
    writer.write("entry 2");

    expect(inner.getLogs()).toStrictEqual([["entry 1", "entry 2"].join("\n")]);
    writer.close();
  });

  test.for([
    { bigStr: "a".repeat(11) },
    { bigStr: "a".repeat(10) },
  ])(`バイト数によるフラッシュ（bigStr: $bigStr）`, ({ bigStr }) => {

    const inner = new MemoryWriter();
    const writer = new BufferedWriter(inner, 100, 10000, 12,);
    const et = new EventTarget();
    writer.setEventTarget(et);
    writer.write(bigStr);
    expect(inner.getLogs()).toStrictEqual([]);

    writer.write("b");
    expect(inner.getLogs()).toStrictEqual([[bigStr, "b"].join("\n")]);
    writer.close();
  });

  test.for([
    { len: "invalid", intv: 10, vol: 16 },
    { len: NaN, intv: 10, vol: 16 },
    { len: null, intv: 10, vol: 16 },
    { len: NaN, intv: 10, vol: 16 },
    { len: 12, intv: "invalid", vol: 16 },
    { len: 12, intv: NaN, vol: 16 },
    { len: 12, intv: null, vol: 16 },
    { len: 12, intv: 10, vol: "invalid" },
    { len: 12, intv: 10, vol: NaN, },
    { len: 12, intv: 10, vol: null },
  ])(`コンストラクタのバリデーション（$len, $intv, $vol）`, ({ len, intv, vol }) => {

    const inner = new MemoryWriter();
    expect(() => new BufferedWriter(inner, len, intv, vol)).toThrow(/invalid length|invalid interval|invalid volume/);
  });


})