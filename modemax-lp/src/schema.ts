import { Address, Bytes, BigInt } from "@graphprotocol/graph-ts";
import { MarketToken, UserLiquidity, UserLiquiditySnap } from "../generated/schema";
import { BIGINT_ZERO } from "./const";

export function loadOrCreateMarketToken(address: Address): MarketToken {
  const id = address.toHexString();
  let marketToken = MarketToken.load(id);
  if (!marketToken) {
    marketToken = new MarketToken(id);
    marketToken.save();
  }
  return marketToken;
}

export function loadOrCreateUserLiquidity(account: string): UserLiquidity {
  const id = account;
  let userLiquidity = UserLiquidity.load(id);
  if (!userLiquidity) {
    userLiquidity = new UserLiquidity(id);
    userLiquidity.lp = BIGINT_ZERO;
    userLiquidity.basePoints = BIGINT_ZERO;
    userLiquidity.latestUpdateTimestamp = 0;
    userLiquidity.save();
  }
  return userLiquidity;
}

export function createUserLiquiditySnap(account: string, timestamp: i32, lp: BigInt, basePoints: BigInt): void {
  let id = account.
    concat(timestamp.toString());
  let snap = UserLiquiditySnap.load(id);
  let index = 0;
  for (;snap;) {
    snap = UserLiquiditySnap.load(id.concat('-').concat(index.toString()));
    index++;
  }
  if (index > 0) {
    id = id.concat('-').concat(index.toString());
  }
  snap = new UserLiquiditySnap(id);
  snap.account = account;
  snap.timestamp = timestamp;
  snap.lp = lp;
  snap.basePoints = basePoints;
  snap.save();
}