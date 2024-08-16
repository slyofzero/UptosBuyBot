import { sendAlert } from "@/bot/sendAlert";
import { AptosTransaction, ReceiversData } from "@/types";
import { UPTOS_TOKEN } from "@/utils/constants";
import { log } from "@/utils/handlers";
import { getTokenAddress, getTokenMetadata } from "@/utils/web3";
import { prevTxns, setPrevTxn } from "@/vars/prevTxn";

export async function processTxn(tx: AptosTransaction) {
  const { events, changes, version } = tx;
  if (!events?.length || !changes?.length) return false;

  const receivers: ReceiversData = {};

  depositsLoop: for (const event of events) {
    const receiver = event.guid.account_address;
    const isTokenDeposit = event.type.endsWith("::coin::DepositEvent");
    if (!isTokenDeposit) continue;

    const { creation_number } = event.guid;

    for (const change of changes) {
      const changeData = change.data;
      if (!changeData || change.address !== receiver) continue;

      const changeCreationNum =
        changeData.data.deposit_events?.guid.id.creation_num;
      if (changeCreationNum !== creation_number) continue;

      const token = getTokenAddress(changeData.type);
      if (token !== UPTOS_TOKEN) continue depositsLoop;

      const metadata = await getTokenMetadata(token);
      if (!metadata) continue depositsLoop;
      const { decimals, symbol } = metadata;

      const amount = Number(event.data.amount) / 10 ** decimals;

      receivers[receiver] = {
        token,
        tokenReceived: symbol,
        amountReceived: amount,
        amountSent: 0,
        tokenSent: "",
        version,
        receiver,
      };
    }
  }

  withdrawalsLoop: for (const event of events) {
    const receiver = event.guid.account_address;
    const isTokenDeposit = event.type.endsWith("::coin::WithdrawEvent");
    const receiverData = receivers[receiver];
    if (!isTokenDeposit || !receiverData) continue;

    const { creation_number } = event.guid;

    for (const change of changes) {
      const changeData = change.data;
      if (!changeData || change.address !== receiver) continue;

      const changeCreationNum =
        changeData.data.withdraw_events?.guid.id.creation_num;
      if (changeCreationNum !== creation_number) continue;

      const token = getTokenAddress(changeData.type);
      const metadata = await getTokenMetadata(token);
      if (!metadata) continue withdrawalsLoop;
      const { decimals, symbol } = metadata;
      const amount = Number(event.data.amount) / 10 ** decimals;

      receivers[receiver] = {
        ...receiverData,
        tokenSent: symbol,
        amountSent: amount,
      };
    }
  }

  for (const receiver in receivers) {
    const receiverData = receivers[receiver];

    const isMissingFields = Object.values(receiverData).some((value) => !value);
    if (isMissingFields) {
      delete receivers[receiver];
      continue;
    }

    const { tokenReceived, amountReceived, tokenSent, amountSent } =
      receiverData;
    const txn = `${version}_${amountReceived}_${tokenReceived}`;

    if (!prevTxns.includes(txn)) {
      sendAlert(receiverData);
      log(
        `${amountReceived} ${tokenReceived} for ${amountSent} ${tokenSent}, ${version}`
      );
      setPrevTxn(txn);
    } else {
      log(`Duplicate of ${txn}`);
    }
  }
}
