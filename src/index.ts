import * as DiscordRPC from "discord-rpc";
import * as fs from "fs";
import prompt from "prompt";
import * as path from "path";
import "colors";

import { log, error } from "./utils/logger";

let applicationID: string, details: string, state: string, largeImageKey: string, largeImageText: string, config: string;

log("👋 Custom-RPC is now running. Trying to access the config file...".green);

if (fs.existsSync(path.resolve("./config.json"))) {
    log("✅ Config file found. Attempting to gather info... If you wish to edit your configuration, just delete the file.".green);

    gatherInfo();
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
        details = data["details"];
        state = data["state"];
        largeImageKey = data["largeImageKey"];
        largeImageText = data["largeImageText"];

        registerRPC();
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
        details = result.details as string;
        state = result.state as string;
        largeImageKey = result.largeImageKey as string;
        largeImageText = result.largeImageText as string;
        config = result.config as string;

        if (config === "y" || config === "yes") {
            log("🐞 Trying to save your configuration...".blue);

            try {
                const stringifiedData: string = JSON.stringify(result);

                fs.writeFileSync("config.json", stringifiedData);
            } catch (err) {
                error(err as Error);
            }
        }

        registerRPC();
    });
}

function registerRPC() {
    const RPC = new DiscordRPC.Client({ transport: "ipc" });

    function setActivity() {
        RPC.setActivity({
            details,
            state,
            largeImageKey,
            largeImageText,
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
