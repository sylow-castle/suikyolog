import { describe, test, expect } from "vitest"
import { StructuredDataVisitor } from "../src/core/SyslogEncoder.js"

describe("StructuredDataVisitoreクラスのテスト", () => {
  test("visitStartSdIdはエラー", () => {
    const sdVisitor = new StructuredDataVisitor();
    expect(() => sdVisitor.visitStartSdId("test")).toThrow("not implemented");
  });

  test("visitEndSdIdはエラー", () => {
    const sdVisitor = new StructuredDataVisitor();
    expect(() => sdVisitor.visitEndSdId()).toThrow("not implemented");
  });

  test("visitParamはエラー", () => {
    const sdVisitor = new StructuredDataVisitor();
    expect(() => sdVisitor.visitParam("test", "test")).toThrow("not implemented");
  });
});