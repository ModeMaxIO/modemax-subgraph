import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Pair, UserLiquidity, UserLiquiditySnap, UserSwap, UserSwapSnap } from "../../generated/schema";
import { BD_ZERO } from "./const";

export function loadOrCreateUserLiquidity(account: string): UserLiquidity {
  const id = account;
  let userLiquidity = UserLiquidity.load(id);
  if (!userLiquidity) {
    userLiquidity = new UserLiquidity(id);
    userLiquidity.lps = [];
    userLiquidity.pairs = [];
    userLiquidity.derivedUSDs = [];
    userLiquidity.basePoints = BD_ZERO;
    userLiquidity.latestUpdateTimestamp = 0;
    userLiquidity.save();
  }
  return userLiquidity;
}

export function createUserLiquiditySnap(account: string, timestamp: i32, lps: BigDecimal[], pairs: string[], derivedUSDs: BigDecimal[], basePoints: BigDecimal): void {
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
  snap.lps = lps;
  snap.derivedUSDs = derivedUSDs;
  snap.pairs = pairs;
  snap.basePoints = basePoints;
  snap.save();
}

export function loadOrCreateUserSwap(account: string): UserSwap {
  const id = account;
  let userSwap = UserSwap.load(id);
  if (!userSwap) {
    userSwap = new UserSwap(id);
    userSwap.swap = BD_ZERO;
    userSwap.swapUSD = BD_ZERO;
    userSwap.latestUpdateTimestamp = 0;
    userSwap.save();
  }
  return userSwap;
}

export function createUserSwapSnap(account: string, timestamp: i32, swap: BigDecimal, swapUSD: BigDecimal): void {
  let id = account.
    concat(timestamp.toString());
  let snap = UserSwapSnap.load(id);
  let index = 0;
  for (; snap;) {
    snap = UserSwapSnap.load(id.concat('-').concat(index.toString()));
    index++;
  }
  if (index > 0) {
    id = id.concat('-').concat(index.toString());
  }
  snap = new UserSwapSnap(id);
  snap.account = account;
  snap.timestamp = timestamp;
  snap.swap = swap;
  snap.swapUSD = swapUSD;
  snap.save();
}