import "reflect-metadata";
import minimist from "minimist";

export const main = (argv: Readonly<string[]>) => {
  const args = minimist(argv.slice(2));
  // eslint-disable-next-line no-console
  console.log(args);
};
