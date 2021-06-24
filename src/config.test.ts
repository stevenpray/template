import { Config } from "./config";

describe("Config", () => {
  it("should be exported class", () => {
    expect.assertions(2);
    expect(Config).toBeFunction();
    expect(new Config({}, {})).toBeInstanceOf(Config);
  });

  it("instance", () => {
    expect.assertions(11);

    expect(new Config()).toBeInstanceOf(Config);
    expect(new Config({ a: "a" }).get("a")).toStrictEqual("a");
    expect(new Config({ a: "a" }).get("a")).toBeFrozen();
    expect(new Config({ a: "a" }).get("b")).toBeUndefined();
    expect(new Config({ a: "a" }).get("b", "b")).toStrictEqual("b");
    expect(new Config({ a: "a" }).get("b", "b")).toBeFrozen();
    expect(new Config({ a: "a" }).all()).toBeFrozen();
    expect(new Config({ a: "a" }, { a: "c", b: "b" }).get("b")).toStrictEqual("b");
    expect(new Config({ a: "a" }, { a: "c", b: "b" }).get("a")).toStrictEqual("a");
    expect(new Config({ a: "a" }, { a: "c", b: "b" }).all()).toContainAllKeys(["a", "b"]);
    expect(new Config({ a: "a" }, { a: "c", b: "b" }).all()).toBeFrozen();
  });

  it("should define defaults static method", () => {
    expect.assertions(1);
    expect(Config["defaults"]).toBeFunction();
  });

  it("should define freeze static method", () => {
    expect.assertions(1);
    expect(Config["freeze"]).toBeFunction();
  });

  describe("Config.defaults", () => {
    it("should recursively assign default values", () => {
      expect.assertions(8);
      const o = { x: { bar: "baz", y: { idk: false } } };
      const d = { x: { bar: "ignored" }, z: "z" };
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
      const freeze = Config["freeze"];
      const frozen = freeze({ foo: { bar: "baz", baz: { idk: false } } });

      expect(frozen).toBeFrozen();
      expect(frozen.foo).toBeFrozen();
      expect(frozen.foo.bar).toBeFrozen();
      expect(frozen.foo.baz).toBeFrozen();
      expect(frozen.foo.baz.idk).toBeFrozen();
    });
  });
});
