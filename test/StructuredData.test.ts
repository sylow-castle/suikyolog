import { describe, it, expect, vi } from 'vitest';
import { StructuredData } from '../src/StructuredData.js';
import { a } from 'vitest/dist/chunks/suite.d.udJtyAgw.js';

describe('StructuredData', () => {
  it("SDIDの典型例", () => {
    const sd = new StructuredData()
      .add("testSdId", "testKey", "testValue");
    expect(sd.toString()).toBe(`[testSdId testKey="testValue"]`);
  });

  it("addを引数1個で呼ぶ", () => {
    const sd = new StructuredData()
      .add("testSdId", undefined, undefined);
    expect(sd.toString()).toBe(`[testSdId]`);
  });

  it("add(set)を引数2個で呼ぶ", () => {
    const longStr = "a".repeat(32);
    const sd = new StructuredData()
      .add(longStr, undefined, undefined)
      .set("testKey", "testValue", undefined);
    expect(sd.toString()).toBe(`[${longStr} testKey="testValue"]`);
  });

  it("addを引数0個で呼ぶ", () => {
    const sd = new StructuredData();
    expect(() => { sd.add(undefined, undefined, undefined) }).toThrow("arg1 is required: undefined.");
  });

  it("SDIDに空文字を指定するとエラーを投げる", () => {
    const sd = new StructuredData();
    expect(() => {
      sd.add("", undefined, undefined)
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  it("SDIDに長すぎる文字列を指定するとエラーを投げる", () => {
    const longStr = "a".repeat(33);
    const sd = new StructuredData();
    expect(() => {
      sd.add(longStr, undefined, undefined)
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  it("SDIDに禁止文字を指定するとエラーを投げる", () => {
    const sd = new StructuredData();
    const fobbidens = ['=', ']', '"', ' '];

    for (const char of fobbidens) {
      const sdId = `abc${char}def`;
      try {
        expect(() => {
          sd.add(sdId, "testName", "testValue");
        }).toThrow(/SD-NAME has not allowed chars/);
      } catch (e) {
        console.error(`sdId: ${sdId}`);
        throw e;
      }
    }
  });

  it("キー名にnullを指定するとエラーを投げる", () => {
    const sd = new StructuredData();
    expect(() => {
      sd.add("testSdId", undefined, undefined)
        .add("testSdName", null, "")
    }).toThrow(/key is not string/);
  });

  it("キー名に空文字を指定するとエラーを投げる", () => {
    const sd = new StructuredData();
    expect(() => {
      sd.add("testSdId", undefined, undefined)
        .add("testSdId", "", "")
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  it("キー名に長すぎる文字列を指定するとエラーを投げる", () => {
    const longStr = "a".repeat(33);
    const sd = new StructuredData();
    expect(() => {
      sd.add(longStr, "testValue", "")
    }).toThrow(/SD-NAME is 1-32 length/);
  });

  it("キー名に禁止文字を指定するとエラーを投げる", () => {
    const sd = new StructuredData();
    const fobbidens = ['=', ']', '"', ' '];
    for (const char of fobbidens) {
      const paramName = `abc${char}def`
      try {
        expect(() => {
          sd.add("testSdId", paramName, "testValue");
        }).toThrow(/SD-NAME has not allowed chars/);
      } catch (e) {
        console.log(`paramName: ${paramName}`)
        throw e;
      }
    }
  });

  it('PARAM-VALUEは",],\をエスケープする', () => {
    const sd = new StructuredData()
      .add("testSdId", "testKey", '"]\\');
    expect(sd.toString()).toBe(`[testSdId testKey="\\"\\]\\\\"]`);
  });





  it("useに文字列以外を投げるとエラーを投げる", () => {
    const sd = new StructuredData();
    expect(() => {
      sd.add("testSdId", "testName", "testParam")
        .use(null);
    }).toThrow(/sdId is not string/);
  });

  it("useにまだ無いキーを投げるとエラーを投げる", () => {
    const sd = new StructuredData();
    expect(() => {
      sd.add("testSdId", "testName", "testParam")
        .use("notAddedSdId");
    }).toThrow(/Not found sdId/);
  });

});