import { Context } from "./context";

describe("Context", () => {
  it("should be exported class", () => {
    expect.assertions(2);
    expect(Context).toBeFunction();
    expect(new Context()).toBeInstanceOf(Context);
  });

  it("should define dir property", () => {
    expect.assertions(1);
    expect(new Context().dir).toBeObject();
  });

  it("should define env property", () => {
    expect.assertions(1);
    expect(new Context().env).toBeObject();
  });

  it("should define pkg property", () => {
    expect.assertions(1);
    expect(new Context().pkg).toBeObject();
  });
});
