import "reflect-metadata";
import parser from "yargs-parser";

export const main = async (args: string[]) => {
  // eslint-disable-next-line no-console
  console.log(parser(args.slice(2)));

  return Promise.resolve();
};
