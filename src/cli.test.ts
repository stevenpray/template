import { Cli } from "./cli";

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
});
