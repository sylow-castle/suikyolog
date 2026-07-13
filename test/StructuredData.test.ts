import { describe, test, expect } from 'vitest';
import { StructuredData } from '../src/StructuredData.js';

describe("StructuredDataクラスのテスト", () => {
  test("SDIDの典型例", () => {
    const sd = new StructuredData()
      .add("testSdId", "testKey", "testValue");
    expect(sd.toString()).toBe(`[testSdId testKey="testValue"]`);
  });

  test("addを引数1個で呼ぶ", () => {
    const sd = new StructuredData()
      .add("testSdId", undefined, undefined);
    expect(sd.toString()).toBe(`[testSdId]`);
  });

  test("add(set)を引数2個で呼ぶ", () => {
    const longStr = "a".repeat(32);
    const sd = new StructuredData()
      .add(longStr, undefined, undefined)
      .set("testKey", "testValue", undefined);
    expect(sd.toString()).toBe(`[${longStr} testKey="testValue"]`);
  });

  test("addを引数0個で呼ぶ", () => {
    const sd = new StructuredData();
    expect(() => { sd.add(undefined, undefined, undefined) }).toThrow("arg1 is required: undefined.");
  });

  test("SDIDに空文字を指定するとエラーを投げる", () => {
    const sd = new StructuredData();
    expect(() => {
      sd.add("", undefined, undefined)
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  test("SDIDに長すぎる文字列を指定するとエラーを投げる", () => {
    const longStr = "a".repeat(33);
    const sd = new StructuredData();
    expect(() => {
      sd.add(longStr, undefined, undefined)
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  test.for([
    { invalidSdId: "=" },
    { invalidSdId: "]" },
    { invalidSdId: '"' },
    { invalidSdId: " " },
  ])("SDIDに禁止文字を指定するとエラーを投げる(invalidSdId: $invalidSdId)", ({ invalidSdId }) => {
    const sd = new StructuredData();
    expect(() => {
      sd.add(invalidSdId, "testName", "testValue");
    }).toThrow(/SD-NAME has not allowed chars/);
  });

  test("キー名にnullを指定するとエラーを投げる", () => {
    const sd = new StructuredData();
    expect(() => {
      sd.add("testSdId", undefined, undefined)
        .add("testSdName", null, "")
    }).toThrow(/key is not string/);
  });

  test("キー名に空文字を指定するとエラーを投げる", () => {
    const sd = new StructuredData();
    expect(() => {
      sd.add("testSdId", undefined, undefined)
        .add("testSdId", "", "")
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  test("キー名に長すぎる文字列を指定するとエラーを投げる", () => {
    const longStr = "a".repeat(33);
    const sd = new StructuredData();
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
    const sd = new StructuredData();
    expect(() => {
      sd.add("testSdId", paramName, "testValue");
    }).toThrow(/SD-NAME has not allowed chars/);
  });

  test.for([
    { paramValue: '"', escaped: '\\"' },
    { paramValue: ']', escaped: '\\]' },
    { paramValue: '\\', escaped: '\\\\' },
  ])(`PARAM-VALUEは",],\\をエスケープする（paramValue: $escaped）`, ({ paramValue, escaped }) => {
    const sd = new StructuredData()
      .add("testSdId", "testKey", paramValue);
    expect(sd.toString()).toBe(`[testSdId testKey="${escaped}"]`);
  });


  test("useでSD-IDを指定する", () => {
    const sd = new StructuredData();
    sd.add("testSdId1", "testName1", "testParam1")
      .add("testSdId2", "testName2", "testParam2")
      .use("testSdId1")
      .add("testName3", "testParam3", undefined)

    expect(sd.toString()).toBe(`[testSdId1 testName1="testParam1" testName3="testParam3"][testSdId2 testName2="testParam2"]`);
  });

  test("useに文字列以外を投げるとエラーを投げる", () => {
    const sd = new StructuredData();
    expect(() => {
      sd.add("testSdId", "testName", "testParam")
        .use(null);
    }).toThrow(/sdId is not string/);
  });

  test("useにまだ無いキーを投げるとエラーを投げる", () => {
    const sd = new StructuredData();
    expect(() => {
      sd.add("testSdId", "testName", "testParam")
        .use("notAddedSdId");
    }).toThrow(/Not found sdId/);
  });
});