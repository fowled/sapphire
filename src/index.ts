import * as DiscordRPC from "discord-rpc";
import * as fs from "fs";
import prompt from "prompt";
import * as path from "path";
import "colors";

import { log, error } from "./utils/logger";

let applicationID: string;

log("👋 Custom-RPC is now running. Trying to access the config file...".green);

if (fs.existsSync(path.resolve("./config.json"))) {
    prompt.start();

    prompt.get([
        {
            name: "getconfig",
            description: "✅ Config file found. Do you want to load it? (y/n)".magenta,
            required: true
        }
    ], (err, result) => {
        if (err) error(err);

        if (result.getconfig === "y" || result.getconfig === "yes") {
            gatherInfo();
        } else {
            startPrompt();
        }
    });

} else {
    log("❗ Config file not found. Starting prompt...".red);

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

    prompt.get([
        {
            name: "ID",
            description: "The application ID, found in https://discord.com/developers/applications".yellow,
            required: true,
        },

        {
            name: "details",
            description: "The second line of your RichPresence status".yellow,
            required: true
        },

        {
            name: "state",
            description: "The third line of your RichPresence status".yellow,
            required: true
        },

        {
            name: "largeImageKey",
            description: "The link to the image you want to display".yellow,
            required: true
        },

        {
            name: "largeImageText",
            description: "The description shown above the image".yellow,
            required: true
        },

        {
            name: "config",
            description: "Do you want this configuration to be saved in a config.json file? (y/n)".magenta,
            required: true
        }
    ], (err, result) => {
        if (err) error(err);

        applicationID = result.ID as string;

        if (result.config === "y" || result.config === "yes") {
            log("🐞 Trying to save your configuration...".blue);

            try {
                const stringifiedData: string = JSON.stringify(result);

                fs.writeFileSync("config.json", stringifiedData);
            } catch (err) {
                error(err as Error);
            }
        }

        registerRPC(result);
    });
}

function registerRPC(info: any) {
    const RPC = new DiscordRPC.Client({ transport: "ipc" });

    function setActivity() {
        RPC.setActivity({
            details: info.details,
            state: info.state,
            largeImageKey: info.largeImageKey,
            largeImageText: info.largeImageText,
            instance: false
        });
    }

    RPC.on("ready", () => {
        log("👍 Displaying the Rich Presence status...".cyan);

        setActivity();
    });

    RPC.login({ clientId: applicationID }).catch(err => {
        error(err);
    });
}
