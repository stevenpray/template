import { cli } from "./cli";

describe("cli", () => {
  it("should export cli function", () => {
    expect.assertions(1);
    expect(cli).toBeFunction();
  });
});
