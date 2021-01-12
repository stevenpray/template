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
    expect.assertions(2);

    class FooCommand extends Command {
      run() {
        return undefined;
      }
    }

    expect(new FooCommand(mock<Context>(), mock<Logger>()).run).toBeFunction();
    expect(new FooCommand(mock<Context>(), mock<Logger>()).exit).toBeFunction();
  });

  it("should define protected context and logger properties", async () => {
    expect.assertions(3);

    class FooCommand extends Command {
      run() {
        expect(this.context).toBeDefined();
        expect(this.logger).toBeDefined();
        return undefined;
      }
    }

    const command = new FooCommand(mock<Context>(), mock<Logger>());
    command.run();
    expect(await command.exit(0, null)).toBeUndefined();
  });

  it("should define protected spawn method", () => {
    expect.assertions(1);

    class FooCommand extends Command {
      run() {
        return undefined;
      }
    }

    const command = new FooCommand(mock<Context>(), mock<Logger>());
    expect(command["spawn"]("node -v", { stdout: "ignore" }).pid).toBeNumber();
  });
});
