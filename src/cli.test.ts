import type { CliCommandClass } from "./cli";
import { Cli } from "./cli";
import { Command } from "./command";
import { Nullable } from "./types";

describe("Cli", () => {
  it("should be exported class", () => {
    expect.assertions(2);
    expect(Cli).toBeFunction();
    expect(new Cli()).toBeInstanceOf(Cli);
  });

  it("should have run method", async () => {
    expect.assertions(3);
    expect(new Cli().run).toBeFunction();
    expect(new Cli().run()).toBeInstanceOf(Promise);
    expect(await new Cli().run()).toBeUndefined();
  });

  it("should run command by name", async () => {
    expect.assertions(2);
    class TestCommand extends Command {
      run() {
        return undefined;
      }
    }
    const commands = new Map<Nullable<string>, CliCommandClass>([["test", TestCommand]]);
    const cli = new Cli({ commands });
    const promise = cli.run(["", "", "test"]);
    expect(promise).toBeInstanceOf(Promise);
    expect(await promise).toBeUndefined();
  });
});
