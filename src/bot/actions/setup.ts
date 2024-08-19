import { addDocument, updateDocumentById } from "@/firebase";
import { teleBot } from "@/index";
import { StoredGroup } from "@/types";
import { getTokenMetadata } from "@/utils/web3";
import { projectGroups, syncProjectGroups } from "@/vars/projectGroups";
import { botSetupState, settingsState, userState } from "@/vars/state";
import { CallbackQueryContext, CommandContext, Context } from "grammy";

export async function inputTokenAddress(
  ctx: CommandContext<Context> | CallbackQueryContext<Context>
) {
  const chatId = ctx.chat?.id || ctx.from?.id;

  if (!chatId) return ctx.reply("Please restart the command again.");
  const projectGroup =
    ctx.update.message?.chat_shared?.chat_id ||
    settingsState[chatId]?.projectId;

  if (!projectGroup)
    return ctx.reply(
      "Couldn't find the project group ID, please do /setup again"
    );

  botSetupState[chatId] = { projectGroup };

  const text = "❔ Send me the token address to start alerts for in the group.";
  userState[chatId] = "setTokenAddress";
  ctx.reply(text);
}

export async function setTokenAddress(ctx: CommandContext<Context>) {
  const chatId = ctx.chat.id;
  const tokenAddress = ctx.message?.text;

  const projectGroup = botSetupState[chatId].projectGroup;

  if (!projectGroup) return ctx.reply("Please restart the command again.");

  const tokenMetadata = await getTokenMetadata(tokenAddress || "");
  if (!tokenAddress || !tokenMetadata) {
    return ctx.reply("Please enter a valid Aptos token address");
  }

  delete userState[chatId];

  const { symbol } = tokenMetadata;

  const projectGroupData = projectGroups.find(
    ({ chatId }) => chatId === projectGroup
  );

  if (projectGroupData) {
    updateDocumentById<StoredGroup>({
      id: projectGroupData.id || "",
      collectionName: "project_groups",
      updates: { token: tokenAddress },
    }).then(() => syncProjectGroups());
  } else {
    addDocument<StoredGroup>({
      collectionName: "project_groups",
      data: { chatId: projectGroup, token: tokenAddress },
    }).then(() => syncProjectGroups());
  }

  ctx.reply(`✅ Buybot started for the group`);
  teleBot.api.sendMessage(
    projectGroup,
    `This group will now start receiving buy alerts for ${symbol}`
  );
}
