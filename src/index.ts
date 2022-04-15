import DiscordRPC from "discord-rpc";
import prompt from "prompt";
import chalk from "chalk";
import path from "path";
import fs from "fs";

import { log, error } from "./utils/logger";

let applicationID: string;

prompt.message = `${chalk.gray(new Date().toLocaleTimeString())} ${chalk.cyan("[ask]")}`;

log(chalk.green("👋 Custom-RPC is now running. Trying to access the config file..."));

if (fs.existsSync(path.resolve("./config.json"))) {
	prompt.start();

	prompt.get(
		[
			{
				name: "getconfig",
				description: chalk.magenta("✅ Config file found. Do you want to load it? (y/n)"),
				required: true,
			},
		],
		(err, result) => {
			if (err) error(err);

			if (result.getconfig === "y" || result.getconfig === "yes") {
				gatherInfo();
			} else {
				startPrompt();
			}
		}
	);
} else {
	log(chalk.red("❗ Config file not found. Starting prompt..."));

	startPrompt();
}

function gatherInfo() {
	fs.readFile(path.resolve("./config.json"), "utf8", (err, rawdata) => {
		if (err) {
			error(err);
		}

		const data = JSON.parse(rawdata);

		applicationID = data["ID"];

		registerRPC(data);
	});
}

function startPrompt() {
	prompt.start();

	prompt.get(
		[
			{
				name: "ID",
				description: chalk.yellow("The application ID, found in https://discord.com/developers/applications"),
				required: true,
			},

			{
				name: "details",
				description: chalk.yellow("The second line of your RichPresence status"),
				required: true,
			},

			{
				name: "state",
				description: chalk.yellow("The third line of your RichPresence status"),
				required: true,
			},

			{
				name: "largeImageKey",
				description: chalk.yellow("The link to the image you want to display"),
				required: true,
			},

			{
				name: "largeImageText",
				description: chalk.yellow("The description shown above the image"),
				required: true,
			},

			{
				name: "startTimestamp",
				description: chalk.yellow("Enable start timestamp? (y/n)"),
				required: true,
			},

			{
				name: "config",
				description: chalk.magenta("Do you want this configuration to be saved in a config.json file? (y/n)"),
				required: true,
			},
		],
		(err, result) => {
			if (err) error(err);

			applicationID = result.ID as string;

			if (result.config === "y" || result.config === "yes") {
				log(chalk.blue("🐞 Trying to save your configuration..."));

				try {
					const stringifiedData: string = JSON.stringify(result);

					fs.writeFileSync("config.json", stringifiedData);
				} catch (err) {
					error(err as Error);
				}
			}

			registerRPC(result);
		}
	);
}

function registerRPC(info: any) {
	const RPC = new DiscordRPC.Client({ transport: "ipc" });
	let startTimestamp: any;

	if (info.startTimestamp === "y" || info.startTimestamp === "yes") {
		startTimestamp = new Date();
	}

	function setActivity() {
		RPC.setActivity({
			details: info.details,
			state: info.state,
			largeImageKey: info.largeImageKey,
			largeImageText: info.largeImageText,
			instance: false,
			startTimestamp,
		});
	}

	RPC.on("ready", () => {
		log(chalk.cyan("👍 Displaying the Rich Presence status..."));

		setActivity();
	});

	RPC.login({ clientId: applicationID }).catch((err) => {
		error(err);
	});
}
