import { Context } from "./context";
import { Logger } from "./logger";

describe("Logger", () => {
  it("should be exported class", () => {
    expect.assertions(1);
    expect(Logger).toBeFunction();
  });

  it("should define static property levels", () => {
    expect.assertions(2);
    expect(Logger.levels).toBeArrayOfSize(6);
    expect(Logger.levels).toContainAllValues(["trace", "debug", "info", "warn", "error", "fatal"]);
  });

  describe("instance", () => {
    let context: Context;
    beforeEach(() => {
      context = new Context();
    });

    it("should return new instance", () => {
      expect.assertions(1);
      expect(new Logger(context)).toBeInstanceOf(Logger);
    });

    it("should define method create", () => {
      expect.assertions(6);
      const logger = new Logger(context);
      for (const level of [...Logger.levels]) {
        expect(logger.create()).toHaveProperty(level);
      }
    });
  });
});
