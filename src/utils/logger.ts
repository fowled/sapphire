import chalk from "chalk";

export function log(message: string): void {
	process.stdout.write(`${chalk.gray(new Date().toLocaleTimeString())} ${chalk.green("[RPC]")}: ${message}\n`);
}

export function error(message: string | Error): void {
	process.stderr.write(`${chalk.gray(new Date().toLocaleTimeString())} ${chalk.red("[err]")} ${message instanceof Error ? `${message.name}\n\t${message.message}\n\t${message.stack}` : message}\n`);
}
