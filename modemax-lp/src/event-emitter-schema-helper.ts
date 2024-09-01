import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { TokenPrice, UserStat, UserTradeSnap } from "../generated/schema";
import { BD_ZERO, BI_ZERO } from "./const";
export function loadOrCreateUserStat(account: string): UserStat {
  const id = account;
  let userStat = UserStat.load(id);
  if (!userStat) {
    userStat = new UserStat(id);
    userStat.lp = BD_ZERO;
    userStat.trade = BD_ZERO;
    userStat.referral = BD_ZERO;
    userStat.swap = BD_ZERO;
    userStat.save();
  }
  return userStat;
}

export function createUserTradeSnap(account: string, hash: string, logIndex: BigInt, timestamp: BigInt, trade: BigDecimal): void {
  const id = account.concat(':').concat(hash).concat(':').concat(logIndex.toString());
  let snap = UserTradeSnap.load(id);
  if (!snap) {
    snap = new UserTradeSnap(id);
    snap.account = account;
    snap.timestamp = timestamp.toI32();
    snap.trade = trade;
    snap.save();
  }
}

export function loadOrCreateTokenPrice(tokenAddress: string): TokenPrice {
  let tokenPrice = TokenPrice.load(tokenAddress);
  if (!tokenPrice) {
    tokenPrice = new TokenPrice(tokenAddress);
    tokenPrice.minPrice = BI_ZERO;
    tokenPrice.maxPrice = BI_ZERO;
    tokenPrice.save();
  }
  return tokenPrice;
}