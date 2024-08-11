import { BigInt } from "@graphprotocol/graph-ts";
import { UserEsTokenStake, UserEsTokenStakeSnap } from "../generated/schema";
import { BIGINT_ZERO } from "./const";

export function loadOrCreateUserEsTokenStake(account: string): UserEsTokenStake {
  let userTokenStake = UserEsTokenStake.load(account);
  if (!userTokenStake) {
    userTokenStake = new UserEsTokenStake(account);
    userTokenStake.token = BIGINT_ZERO;
    userTokenStake.basePoints = BIGINT_ZERO;
    userTokenStake.latestUpdateTimestamp = 0;
    userTokenStake.save();
  }
  return userTokenStake;
}

export function createUserEsTokenStakeSnap(account: string, timestamp: i32, token: BigInt, basePoints: BigInt): void {
  let id = account.
    concat(timestamp.toString());
  let snap = UserEsTokenStakeSnap.load(id);
  let index = 0;
  for (;snap;) {
    snap = UserEsTokenStakeSnap.load(id.concat('-').concat(index.toString()));
    index++;
  }
  if (index > 0) {
    id = id.concat('-').concat(index.toString());
  }
  snap = new UserEsTokenStakeSnap(id);
  snap.account = account;
  snap.timestamp = timestamp;
  snap.token = token;
  snap.basePoints = basePoints;
  snap.save();
}