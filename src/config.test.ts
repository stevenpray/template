import { Config } from "./config";

describe("Config", () => {
  it("should be exported class", () => {
    expect.assertions(1);
    expect(Config).toBeFunction();
  });

  it("should define static method defaults", () => {
    expect.assertions(1);
    expect(Config.defaults).toBeFunction();
  });

  it("should define static method freeze", () => {
    expect.assertions(1);
    expect(Config.freeze).toBeFunction();
  });

  describe("Config.defaults", () => {
    it("should recursively assign default values", () => {
      expect.assertions(8);
      const d = { x: { bar: "ignored" }, z: "z" };
      const o = { x: { bar: "baz", y: { idk: false } } };
      const config = Config.defaults(o, d);

      expect(config).toBeFrozen();
      expect(config.x).toBeFrozen();
      expect(config.x.bar).toStrictEqual("baz");
      expect(config.x.bar).toBeFrozen();
      expect(config.x.y.idk).toStrictEqual(false);
      expect(config.x.y).toBeFrozen();
      expect(config.z).toStrictEqual("z");
      expect(config.z).toBeFrozen();
    });
  });

  describe("Config.freeze", () => {
    it("should recursively freeze", () => {
      expect.assertions(5);
      const frozen = Config.freeze({ foo: { bar: "baz", baz: { idk: false } } });

      expect(frozen).toBeFrozen();
      expect(frozen.foo).toBeFrozen();
      expect(frozen.foo.bar).toBeFrozen();
      expect(frozen.foo.baz).toBeFrozen();
      expect(frozen.foo.baz.idk).toBeFrozen();
    });
  });
});
