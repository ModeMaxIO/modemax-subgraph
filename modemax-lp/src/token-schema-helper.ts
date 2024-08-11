import { BigInt } from "@graphprotocol/graph-ts";
import { UserTokenStake, UserTokenStakeSnap } from "../generated/schema";
import { BIGINT_ZERO } from "./const";

export function loadOrCreateUserTokenStake(account: string): UserTokenStake {
  let userTokenStake = UserTokenStake.load(account);
  if (!userTokenStake) {
    userTokenStake = new UserTokenStake(account);
    userTokenStake.token = BIGINT_ZERO;
    userTokenStake.basePoints = BIGINT_ZERO;
    userTokenStake.latestUpdateTimestamp = 0;
    userTokenStake.save();
  }
  return userTokenStake;
}

export function createUserTokenStakeSnap(account: string, timestamp: i32, token: BigInt, basePoints: BigInt): void {
  let id = account.
    concat(timestamp.toString());
  let snap = UserTokenStakeSnap.load(id);
  let index = 0;
  for (;snap;) {
    snap = UserTokenStakeSnap.load(id.concat('-').concat(index.toString()));
    index++;
  }
  if (index > 0) {
    id = id.concat('-').concat(index.toString());
  }
  snap = new UserTokenStakeSnap(id);
  snap.account = account;
  snap.timestamp = timestamp;
  snap.token = token;
  snap.basePoints = basePoints;
  snap.save();
}