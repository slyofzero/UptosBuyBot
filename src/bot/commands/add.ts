import { onlyAdmin } from "@/utils/bot";
import { BOT_USERNAME } from "@/utils/env";
import { CommandContext, Context, InlineKeyboard } from "grammy";

export async function addToken(ctx: CommandContext<Context>) {
  const { type, id } = ctx.chat;

  if (type === "private") {
    const text = `❔ Do /add in the group @${BOT_USERNAME} is added to`;

    return ctx.reply(text);
  } else if (await onlyAdmin(ctx)) {
    const text =
      "To add or update the token for the project, click below to continue in a private chat";
    const keyboard = new InlineKeyboard().url(
      "Continue in private chat",
      `https://t.me/${BOT_USERNAME}?start=addToken_${id}`
    );

    return ctx.reply(text, { reply_markup: keyboard });
  }
}
