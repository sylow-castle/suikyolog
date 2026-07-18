import { describe, test, expect } from 'vitest';
import { MutableStructuredData } from '../src/core/StructuredData.js';
import { StructuredDataEncoder } from '../src/core/SyslogEncoder.js';

describe("StructuredDataクラスのテスト", () => {
  test("SDIDの典型例", () => {
    const encoder = new StructuredDataEncoder();
    const sd = new MutableStructuredData()
      .add("testSdId", "testKey", "testValue");
    expect(encoder.encode(sd)).toBe(`[testSdId testKey="testValue"]`);
  });

  test("addを引数1個で呼ぶ", () => {
    const sd = new MutableStructuredData()
      .add("testSdId", undefined as any, undefined as any);
    const encoder = new StructuredDataEncoder();
    expect(encoder.encode(sd)).toBe(`[testSdId]`);
  });

  test("add(set)を引数2個で呼ぶ", () => {
    const longStr = "a".repeat(32);
    const sd = new MutableStructuredData()
      .add(longStr, undefined as any, undefined as any)
      .set("testKey", "testValue", undefined as any);
    const encoder = new StructuredDataEncoder();
    expect(encoder.encode(sd)).toBe(`[${longStr} testKey="testValue"]`);
  });

  test("addを引数0個で呼ぶ", () => {
    const sd = new MutableStructuredData();
    expect(() => { sd.add(undefined as any, undefined as any, undefined as any) }).toThrow("arg1 is required: undefined.");
  });

  test("SDIDに空文字を指定するとエラーを投げる", () => {
    const sd = new MutableStructuredData();
    expect(() => {
      sd.add("", undefined as any, undefined as any)
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  test("SDIDに長すぎる文字列を指定するとエラーを投げる", () => {
    const longStr = "a".repeat(33);
    const sd = new MutableStructuredData();
    expect(() => {
      sd.add(longStr, undefined as any, undefined as any)
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  test.for([
    { invalidSdId: "=" },
    { invalidSdId: "]" },
    { invalidSdId: '"' },
    { invalidSdId: " " },
  ])("SDIDに禁止文字を指定するとエラーを投げる(invalidSdId: $invalidSdId)", ({ invalidSdId }) => {
    const sd = new MutableStructuredData();
    expect(() => {
      sd.add(invalidSdId, "testName", "testValue");
    }).toThrow(/SD-NAME has not allowed chars/);
  });

  test("キー名にnullを指定するとエラーを投げる", () => {
    const sd = new MutableStructuredData();
    expect(() => {
      sd.add("testSdId", undefined as any, undefined as any)
        .add("testSdName", null as any, "")
    }).toThrow(/key is not string/);
  });

  test("キー名に空文字を指定するとエラーを投げる", () => {
    const sd = new MutableStructuredData();
    expect(() => {
      sd.add("testSdId", undefined as any, undefined as any)
        .add("testSdId", "", "")
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  test("キー名に長すぎる文字列を指定するとエラーを投げる", () => {
    const longStr = "a".repeat(33);
    const sd = new MutableStructuredData();
    expect(() => {
      sd.add(longStr, "testValue", "")
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  test.for([
    { paramName: "=" },
    { paramName: "]" },
    { paramName: '"' },
    { paramName: " " },
  ])("キー名に禁止文字を指定するとエラーを投げる(paramName: $paramName)", ({ paramName }) => {
    const sd = new MutableStructuredData();
    expect(() => {
      sd.add("testSdId", paramName, "testValue");
    }).toThrow(/SD-NAME has not allowed chars/);
  });

  test.for([
    { paramValue: '"', escaped: '\\"' },
    { paramValue: ']', escaped: '\\]' },
    { paramValue: '\\', escaped: '\\\\' },
  ])(`PARAM-VALUEは",],\\をエスケープする（paramValue: $escaped）`, ({ paramValue, escaped }) => {
    const encoder = new StructuredDataEncoder();
    const sd = new MutableStructuredData()
      .add("testSdId", "testKey", paramValue);
    expect(encoder.encode(sd)).toBe(`[testSdId testKey="${escaped}"]`);
  });


  test("useでSD-IDを指定する", () => {
    const sd = new MutableStructuredData();
    sd.add("testSdId1", "testName1", "testParam1")
      .add("testSdId2", "testName2", "testParam2")
      .use("testSdId1")
      .add("testName3", "testParam3", undefined as any)

    const encoder = new StructuredDataEncoder();
    expect(encoder.encode(sd)).toBe(`[testSdId1 testName1="testParam1" testName3="testParam3"][testSdId2 testName2="testParam2"]`);
  });

  test("useに文字列以外を投げるとエラーを投げる", () => {
    const sd = new MutableStructuredData();
    expect(() => {
      sd.add("testSdId", "testName", "testParam")
        .use(null);
    }).toThrow(/sdId is not string/);
  });

  test("useにまだ無いキーを投げるとエラーを投げる", () => {
    const sd = new MutableStructuredData();
    expect(() => {
      sd.add("testSdId", "testName", "testParam")
        .use("notAddedSdId");
    }).toThrow(/Not found sdId/);
  });
});