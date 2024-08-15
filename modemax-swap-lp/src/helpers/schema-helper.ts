import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Pair, UserLiquidity, UserLiquiditySnap } from "../../generated/schema";
import { BD_ZERO } from "./const";

export function loadOrCreateUserLiquidity(account: string): UserLiquidity {
  const id = account;
  let userLiquidity = UserLiquidity.load(id);
  if (!userLiquidity) {
    userLiquidity = new UserLiquidity(id);
    userLiquidity.lp = BD_ZERO;
    userLiquidity.lpUSD = BD_ZERO;
    userLiquidity.basePoints = BD_ZERO;
    userLiquidity.latestUpdateTimestamp = 0;
    userLiquidity.save();
  }
  return userLiquidity;
}

export function createUserLiquiditySnap(account: string, timestamp: i32, lp: BigDecimal, lpUSD: BigDecimal, basePoints: BigDecimal): void {
  let id = account.
    concat(timestamp.toString());
  let snap = UserLiquiditySnap.load(id);
  let index = 0;
  for (; snap;) {
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
  snap.lpUSD = lpUSD;
  snap.basePoints = basePoints;
  snap.save();
}