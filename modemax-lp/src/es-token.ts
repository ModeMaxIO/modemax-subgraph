import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../generated/EsToken/ERC20"
import { createUserEsTokenStakeSnap, loadOrCreateUserEsTokenStake } from "./es-token-schema-helper";
import { loadStakedToken } from "./schema-helper";

export function handleTransfer(event: TransferEvent): void {
  const stakedToken = loadStakedToken();
  if (!stakedToken) {
    return;
  }
  if (event.params.to == stakedToken.address) {
    // stake
    _storeUserEsTokenStake(event.params.from.toHexString(), event.block.timestamp.toI32(), event.params.value);
  }
  if (event.params.from == stakedToken.address) {
    // unstake
    _storeUserEsTokenStake(event.params.to.toHexString(), event.block.timestamp.toI32(), event.params.value.neg());
    return;
  }
}

function _storeUserEsTokenStake(account: string, timestamp: i32, value: BigInt): void {
  const userEsTokenStake = loadOrCreateUserEsTokenStake(account);
  if (userEsTokenStake.latestUpdateTimestamp > 0) {
    const gainedPointBase = userEsTokenStake.token.times(BigInt.fromI32(timestamp - userEsTokenStake.latestUpdateTimestamp));
    userEsTokenStake.basePoints = userEsTokenStake.basePoints.plus(gainedPointBase);
  }
  // update
  userEsTokenStake.latestUpdateTimestamp = timestamp;
  userEsTokenStake.token = userEsTokenStake.token.plus(value);
  userEsTokenStake.save();
  createUserEsTokenStakeSnap(account, userEsTokenStake.latestUpdateTimestamp, userEsTokenStake.token, userEsTokenStake.basePoints);
}