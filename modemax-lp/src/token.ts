import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../generated/Token/ERC20"
import { loadStakedToken } from "./schema-helper"
import { createUserTokenStakeSnap, loadOrCreateUserTokenStake } from "./token-schema-helper";

export function handleTransfer(event: TransferEvent): void {
  const stakedToken = loadStakedToken();
  if (!stakedToken) {
    return;
  }
  if (event.params.to == stakedToken.address) {
    // stake
    _storeUserTokenStake(event.params.from.toHexString(), event.block.timestamp.toI32(), event.params.value);
    return;
  }
  if (event.params.from == stakedToken.address) {
    // unstake
    _storeUserTokenStake(event.params.to.toHexString(), event.block.timestamp.toI32(), event.params.value.neg());
    return;
  }
}

function _storeUserTokenStake(account: string, timestamp: i32, value: BigInt): void {
  const userTokenStake = loadOrCreateUserTokenStake(account);
  if (userTokenStake.latestUpdateTimestamp > 0) {
    const gainedPointBase = userTokenStake.token.times(BigInt.fromI32(timestamp - userTokenStake.latestUpdateTimestamp));
    userTokenStake.basePoints = userTokenStake.basePoints.plus(gainedPointBase);
  }
  // update
  userTokenStake.latestUpdateTimestamp = timestamp;
  userTokenStake.token = userTokenStake.token.plus(value);
  userTokenStake.save();
  createUserTokenStakeSnap(account, userTokenStake.latestUpdateTimestamp, userTokenStake.token, userTokenStake.basePoints);
}