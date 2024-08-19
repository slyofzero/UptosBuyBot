import { teleBot } from "@/index";
import { startBot } from "./start";
import { log } from "@/utils/handlers";
import { settings } from "./settings";
import { executeStep } from "../executeStep";
import { setUpBot } from "./setupBot";
import { CommandContext, Context } from "grammy";

export function initiateBotCommands() {
  teleBot.api
    .setMyCommands([
      { command: "start", description: "Start the bot" },
      { command: "setup", description: "To setup the buybot" },
      {
        command: "settings",
        description:
          "Setup custom alerts by tweaking the settings (Group only command)",
      },
    ])
    .catch(() => null);

  teleBot.command("start", (ctx) => startBot(ctx));
  teleBot.command("setup", (ctx) => setUpBot(ctx));
  teleBot.command("settings", (ctx) => settings(ctx));

  // @ts-expect-error Type not found
  teleBot.on([":text"], (ctx) => executeStep(ctx));
  // @ts-expect-error Type not found
  teleBot.on([":media"], (ctx) => executeStep(ctx));
  // @ts-expect-error Type not found
  teleBot.on([":animation", ":video"], (ctx) => executeStep(ctx));

  teleBot.on(["message"], (ctx) => {
    executeStep(ctx as CommandContext<Context>);
  });

  log("Bot commands up");
}
