import { Command } from "../command";

export class DefaultCommand extends Command {
  exec() {
    this.logger.info("DefaultCommand.exec");
  }

  exit() {
    this.logger.info("DefaultCommand.exit");
  }
}
