import { Cli } from "./cli";
import { Command } from "./command";

import type { CommandClass } from "./command";

describe("Cli", () => {
  it("should be exported class", () => {
    expect.assertions(2);
    expect(Cli).toBeFunction();
    expect(new Cli()).toBeInstanceOf(Cli);
  });

  it("should have run method", async () => {
    expect.assertions(3);
    expect(new Cli().exec).toBeFunction();
    expect(new Cli().exec()).toBeInstanceOf(Promise);
    expect(await new Cli().exec()).toBeUndefined();
  });

  it("should run command by name", async () => {
    expect.assertions(2);

    class TestCommand extends Command {
      exec() {
        return undefined;
      }
    }

    const commands = new Map<string, CommandClass>([["test", TestCommand]]);
    const cli = new Cli(commands);
    const promise = cli.exec(["", "", "test"]);
    expect(promise).toBeInstanceOf(Promise);
    expect(await promise).toBeUndefined();
  });
});
