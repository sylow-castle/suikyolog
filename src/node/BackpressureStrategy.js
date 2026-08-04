
import * as EventType from "../core/EventType.js";
import { once } from "node:events";

export class BackpressureStrategy {

  handleBackpuressure() {
    throw new Error("not implemented")
  }

  static Drop() { return new DropStrategy() }
  static OnMemory() { return new OnMemoryStrategy() }
  static Wait() { return new WaitStrategy() }
}

class DropStrategy extends BackpressureStrategy {
  #shouldWrite = true;

  handleBackpressure(writer) {
    this.#shouldWrite = false;

    writer.once("drain", () => {
      this.#shouldWrite = true;
    });
  }

  isShouldWrite() {
    return this.#shouldWrite;
  }
}

class OnMemoryStrategy extends BackpressureStrategy {

  handleBackpressure(_writer) { }

  isShouldWrite() {
    return true;
  }

}

class WaitStrategy extends BackpressureStrategy {
  handleBackpressure(writer, outerEvenetTarget) {
    outerEvenetTarget.dispatchEvent(new CustomEvent(EventType.BACKPRESSURE, {
      detail: {
        waitUntilDrain: () => once(writer, EventType.DRAIN)
      }
    }));
  }

  isShouldWrite() {
    return true;
  }

}
