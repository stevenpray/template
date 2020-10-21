import { main } from ".";

describe("index", () => {
  it("should export main function", () => {
    expect.assertions(1);
    expect(main).toBeFunction();
  });
});
