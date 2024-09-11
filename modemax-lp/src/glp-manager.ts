import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  AddLiquidity as AddLiquidityEvent,
  RemoveLiquidity as RemoveLiquidityEvent,
} from "../generated/GlpManager/GlpManager";

import { BD_ZERO, DECIMAL30 } from "./const";
import { createUserLiquiditySnap, loadOrCreateUserLiquidity } from "./schema";
import { getMarketTokenPriceV1 } from "./v1-healper";

export function handleAddLiquidity(event: AddLiquidityEvent): void {
  _storeUserLiquidity(event.params.account.toHexString(), event.block.timestamp.toI32(), event.params.token.toHexString(), event.params.mintAmount)
}

export function handleRemoveLiquidity(event: RemoveLiquidityEvent): void {
  _storeUserLiquidity(event.params.account.toHexString(), event.block.timestamp.toI32(), event.params.token.toHexString(), event.params.glpAmount.neg())
}




function _storeUserLiquidity(account: string, timestamp: i32, targetMarket: string, value: BigInt): void {
  const userLiquidity = loadOrCreateUserLiquidity(account);
  let foundTarget = false;
  const lps = userLiquidity.lps;
  const marketPrices = userLiquidity.marketPrices;
  if (userLiquidity.latestUpdateTimestamp > 0) {
    const pointsIndex = BigDecimal.fromString((timestamp - userLiquidity.latestUpdateTimestamp).toString());
    let gainedPointBase = BD_ZERO;
    for (let i = 0; i < userLiquidity.markets.length; i++) {
      const market = userLiquidity.markets[i];
      const prevPrice = marketPrices[i];
      const lp = lps[i];
      const nowPrice = getMarketTokenPriceV1(market, timestamp);
      let midPrice = BD_ZERO;
      if (nowPrice.isZero()) {
        midPrice = prevPrice;
      } else {
        midPrice = prevPrice.plus(nowPrice.toBigDecimal().div(DECIMAL30)).div(BigDecimal.fromString('2'));
        marketPrices[i] = nowPrice.toBigDecimal().div(DECIMAL30);
      }
      if (market == targetMarket) {
        lps[i] = lps[i].plus(value);
        foundTarget = true;
      }
      gainedPointBase = gainedPointBase.plus(lp.toBigDecimal().times(midPrice).times(pointsIndex));
    }
    userLiquidity.basePoints = userLiquidity.basePoints.plus(gainedPointBase);
  }
  // update
  userLiquidity.latestUpdateTimestamp = timestamp;
  if (!foundTarget) {
    const nowPrice = getMarketTokenPriceV1(targetMarket, timestamp);
    lps.push(value);
    const markets = userLiquidity.markets;
    markets.push(targetMarket);
    userLiquidity.markets = markets;
    marketPrices.push(nowPrice.toBigDecimal().div(DECIMAL30));
  }
  userLiquidity.lps = lps;
  userLiquidity.marketPrices = marketPrices;
  userLiquidity.save();
  createUserLiquiditySnap(account, userLiquidity.latestUpdateTimestamp, userLiquidity.lps, userLiquidity.markets, userLiquidity.marketPrices, userLiquidity.basePoints);
  // FIXME: for modemax
  // const userData = loadOrCreateUserStat(account);
  // userData.lp = userLiquidity.lp.div(DECIMAL18);
  // userData.save();
}