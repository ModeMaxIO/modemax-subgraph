import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { PairFee, PairFeeSnap, Pair, UserLiquidity, UserLiquiditySnap, UserSwap, UserSwapSnap, PairSwap, PairSwapSnap } from "../../generated/schema";
import { BD_ZERO } from "./const";
import { getHourStartTimestamp } from "./utils";

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

export function loadOrCreatePairFee(pair: Pair): PairFee {
  let feeId = pair.id;
  let fee = PairFee.load(feeId);
  if (!fee) {
    fee = new PairFee(feeId);
    fee.feeUsd = BD_ZERO;
    fee.latestUpdateTimestamp = 0;
    pair.fee = feeId;
  }
  fee.save();
  return fee;
}
export function loadOrCreatePairSwap(pair: Pair): PairSwap {
  let swapId = pair.id;
  let fee = PairSwap.load(swapId);
  if (!fee) {
    fee = new PairSwap(swapId);
    fee.swapUsd = BD_ZERO;
    fee.latestUpdateTimestamp = 0;
    pair.swap = swapId;
  }
  fee.save();
  return fee;
}

export function ignoreOrCreatePairFeeSnapOfPrevHour(pair: Pair, newTimestamp: i32): void {
  const fee = loadOrCreatePairFee(pair);
  if (fee.latestUpdateTimestamp == 0) {
    return;
  }

  const newTime = getHourStartTimestamp(newTimestamp);
  const currTime = getHourStartTimestamp(fee.latestUpdateTimestamp);
  if (currTime == newTime) {
    return;
  }

  const currSnapId = pair.id.concat(':').concat(currTime.toString());
  let snap = PairFeeSnap.load(currSnapId);
  if (snap) {
    return;
  }
  snap = new PairFeeSnap(currSnapId);
  snap.pair = pair.id;
  snap.feeUsd = fee.feeUsd;
  snap.timestamp = currTime;
  snap.save();
}

export function ignoreOrCreatePairSwapSnapOfPrevHour(pair: Pair, newTimestamp: i32): void {
  const fee = loadOrCreatePairSwap(pair);
  if (fee.latestUpdateTimestamp == 0) {
    return;
  }

  const newTime = getHourStartTimestamp(newTimestamp);
  const currTime = getHourStartTimestamp(fee.latestUpdateTimestamp);
  if (currTime == newTime) {
    return;
  }

  const currSnapId = pair.id.concat(':').concat(currTime.toString());
  let snap = PairSwapSnap.load(currSnapId);
  if (snap) {
    return;
  }
  snap = new PairSwapSnap(currSnapId);
  snap.pair = pair.id;
  snap.swapUsd = fee.swapUsd;
  snap.timestamp = currTime;
  snap.save();
}