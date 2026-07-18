import {vi,test,describe,expect} from "vitest";
import { StdoutTransporter } from "../src/node/StdoutTransporter.js"
import { stdout } from "node:process";
import { FanoutTransporter } from "../src/core/FanoutTransporter.js";
import { TransporterBuilder } from "../src/core/TransporterBuilder.js";


describe("MultipleTransporterのテスト",() => {
  test('2個指定したら2回呼ばれる', async () => {
    const spy = vi.spyOn(stdout, "write").mockImplementation(() => { });

    TransporterBuilder.start
    const transporter1 = new StdoutTransporter();
    const transporter2 = new StdoutTransporter();
    const transporter = new FanoutTransporter([transporter1, transporter2])
    try {
      await transporter.transport("test");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("test\n"));
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
    }

    // 後始末 
  });
});