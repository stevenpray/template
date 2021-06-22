import { mock } from "jest-mock-extended";
import { Command } from "./command";

import type { Context } from "./context";
import type { Logger } from "./logger";

describe("Command", () => {
  it("should be exported class", () => {
    expect.assertions(1);
    expect(Command).toBeFunction();
  });

  it("should define exit method", () => {
    expect.assertions(1);

    class FooCommand extends Command {
      exec() {
        return undefined;
      }
    }

    expect(new FooCommand(mock<Context>(), mock<Logger>()).exec).toBeFunction();
  });

  it("should define protected context and logger properties", async () => {
    expect.assertions(3);

    class FooCommand extends Command {
      exec() {
        expect(this.context).toBeDefined();
        expect(this.logger).toBeDefined();
        return undefined;
      }

      async exit() {
        return new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const command = new FooCommand(mock<Context>(), mock<Logger>());
    command.exec();
    expect(await command.exit()).toBeUndefined();
  });
});
