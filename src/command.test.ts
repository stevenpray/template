import { mock } from "jest-mock-extended";
import { Command } from "./command";

import type { CommandOptions } from "./command";
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
    const config: CommandOptions = { debug: true };

    it("should define exit method", () => {
      expect.assertions(1);

      class FooCommand extends Command {
        exec() {
          return undefined;
        }
      }

      expect(new FooCommand(context, logger, config).exec).toBeFunction();
    });

    it("should define protected config, context, and logger properties", async () => {
      expect.assertions(4);

      class FooCommand extends Command {
        exec() {
          expect(this.config).toBeDefined();
          expect(this.context).toBeDefined();
          expect(this.logger).toBeDefined();
        }

        async exit() {
          return Promise.resolve();
        }
      }

      const command = new FooCommand(context, logger, config);
      command.exec();
      expect(await command.exit()).toBeUndefined();
    });
  });
});
