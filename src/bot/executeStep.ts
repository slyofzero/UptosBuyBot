import { CallbackQueryContext, CommandContext, Context } from "grammy";
import { userState } from "@/vars/state";
import { removeEmoji, removeEmojiCallback } from "./removeEmoji";
import { removeMedia, removeMediaCallback } from "./removeMedia";
import { inputTokenAddress, setTokenAddress } from "./actions/setup";
import { inputMinBuy, setMinBuy } from "./actions/setMinBuy";
import { inputEmoji, setEmoji } from "./actions/setEmoji";
import { inputWebsite, setWebsite } from "./actions/setWebsite";
import { inputTelegram, setTelegram } from "./actions/setTelegram";
import { inputTwitter, setTwitter } from "./actions/setTwitter";
import { inputMedia, setMedia } from "./actions/setMedia";
import { errorHandler } from "@/utils/handlers";

const steps: { [key: string]: any } = {
  removeEmoji: removeEmojiCallback,
  userRemoveEmoji: removeEmoji,

  removeMedia: removeMediaCallback,
  userRemoveMedia: removeMedia,

  inputTokenAddress,
  setTokenAddress,

  inputMedia,
  setMedia,

  inputMinBuy,
  setMinBuy,

  inputEmoji,
  setEmoji,

  inputWebsite,
  setWebsite,

  inputTelegram,
  setTelegram,

  inputTwitter,
  setTwitter,
};

const requestIds: { [key: number]: any } = {
  0: () => null,
  7: inputTokenAddress,
};

export async function executeStep(
  ctx: CommandContext<Context> | CallbackQueryContext<Context>
) {
  try {
    const request_id = ctx.update.message?.chat_shared?.request_id || 0;
    requestIds[request_id](ctx);

    const chatId = ctx.chat?.id;
    if (!chatId) return ctx.reply("Please redo your action");

    const queryCategory = ctx.callbackQuery?.data?.split("-").at(0);
    const step = userState[chatId] || queryCategory || "";
    const stepFunction = steps[step];

    if (stepFunction) {
      stepFunction(ctx);
    }
  } catch (error) {
    errorHandler(error);
  }
}
