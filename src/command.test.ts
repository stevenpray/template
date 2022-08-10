import { mock } from "jest-mock-extended";
import { Command } from "./command";
import { Config } from "./config";

import type { CommandConfig } from "./command";
import type { Context } from "./context";
import type { LoggerInterface } from "./logger";

describe("Command", () => {
  it("should be exported class", () => {
    expect.assertions(1);
    expect(Command).toBeFunction();
  });

  describe("instance", () => {
    const context = mock<Context>();
    const logger = mock<LoggerInterface>();
    const config = Config.freeze({ debug: true } as CommandConfig);

    it("should define exec method", () => {
      expect.assertions(1);

      class FooCommand extends Command {
        exec() {
          return;
        }
      }

      const command = new FooCommand(context, logger, config);

      expect(command.exec).toBeFunction();
    });

    it("should define protected config, context, and logger properties", async () => {
      expect.assertions(4);

      class FooCommand extends Command {
        exec() {
          expect(this.config).toBeDefined();
          expect(this.context).toBeDefined();
          expect(this.logger).toBeDefined();
        }

        exit() {
          return Promise.resolve();
        }
      }

      const command = new FooCommand(context, logger, config);
      command.exec();
      expect(await command.exit()).toBeUndefined();
    });
  });
});
