import { describe, test, expect } from 'vitest';
import * as Rfc5424Rule from '../src/Rfc5424Rule.js';

describe("Rfc5424Ruleモジュールのテスト", () => {

  test("FACILITY_NUMはFACILITY_STRの逆写像である", () => {
    const facNum = Rfc5424Rule.FACILITY_NUM;
    const facStr = Rfc5424Rule.FACILITY_STR;
    for (const [str, int] of Object.entries(facNum)) {
      expect(facStr[facNum[str]]).toBe(str);
      expect(facNum[facStr[int]]).toBe(int);
    }
  });

  test("SEVERITY_NUMはSEVERITY_STRの逆写像である", () => {
    const sevNum = Rfc5424Rule.SEVERITY_NUM;
    const sevStr = Rfc5424Rule.SEVERITY_STR;
    for (const [str, int] of Object.entries(sevNum)) {
      expect(sevStr[sevNum[str]]).toBe(str);
      expect(sevNum[sevStr[int]]).toBe(int);
    }
  });

});