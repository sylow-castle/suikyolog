import { describe, test, expect } from 'vitest';
import { Encoder } from '../src/core/Encoder.js';

describe("Encoderクラスのテスト", () => {

  test("Encoderクラスは何も実装していない", () => {
    expect(() => (new Encoder() as any).encode(null)).toThrow("not implemented");
  });

  test.for([
    { ctrl: "\x09", ret: "\t" },
    { ctrl: "\x0A", ret: "\n" },
    { ctrl: "\x0D", ret: "\r" },
  ])(`制御文字をエスケープしない（TAB、LF、CR）ctrl ：$escaped`, ({ ctrl, ret }) => {
    expect(Encoder.escapeControlChars(ctrl)).toBe(ret);
  });

  test.for([
    { ctrl: "\x00", ret: "\\x00" },
    { ctrl: "\x08", ret: "\\x08" },
    { ctrl: "\x0B", ret: "\\x0B" },
    { ctrl: "\x0C", ret: "\\x0C" },
    { ctrl: "\x0E", ret: "\\x0E" },
    { ctrl: "\x1F", ret: "\\x1F" },
    { ctrl: "\x7F", ret: "\\x7F" },
    { ctrl: "\u200B", ret: "\\u200B" },
    { ctrl: "\u200F", ret: "\\u200F" },
    { ctrl: "\uFEFF", ret: "\\uFEFF" },
    { ctrl: "\uFFFE", ret: "\\uFFFE" },
    { ctrl: "\uFFFF", ret: "\\uFFFF" },
  ])(`制御文字をエスケープする（TAB、LF、CRを除く）ctrl ：$ret`, ({ ctrl, ret }) => {
    expect(Encoder.escapeControlChars(ctrl)).toBe(ret);
  });
});