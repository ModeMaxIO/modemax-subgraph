import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import { Transfer as TransferEvent } from '../generated/templates/MarketTokenTemplate/MarketToken'
import { BD_ZERO, DECIMAL18, DECIMAL30, ZeroAddress } from './const';
import { createUserLiquiditySnap, loadOrCreateUserLiquidity } from './schema';
import { loadOrCreateUserStat } from './event-emitter-schema-helper';
import { getMarketTokenPrice } from './event-emitter-helper';

export function handleMarketTokenTransfer(event: TransferEvent): void {
  let from = event.params.from.toHexString();
  let to = event.params.to.toHexString();
  let value = event.params.value;

  const market = event.address.toHexString();
  if (from != ZeroAddress) {
    // remove
    _storeUserLiquidity(from, event.block.timestamp.toI32(), market, value.neg());
  }

  if (to != ZeroAddress) {
    // add
    _storeUserLiquidity(to, event.block.timestamp.toI32(), market, value);
  }

}

function _storeUserLiquidity(account: string, timestamp: i32, targetMarket: string, value: BigInt): void {
  const userLiquidity = loadOrCreateUserLiquidity(account);
  let foundTarget = false;
  if (userLiquidity.latestUpdateTimestamp > 0) {
    const pointsIndex = BigDecimal.fromString((timestamp - userLiquidity.latestUpdateTimestamp).toString());
    let gainedPointBase = BD_ZERO;
    for (let i = 0; i < userLiquidity.markets.length; i++) {
      const market = userLiquidity.markets[i];
      const prevPrice = userLiquidity.marketPrices[i];
      const lp = userLiquidity.lps[i];
      const nowPrice = getMarketTokenPrice(market, timestamp);
      let midPrice = BD_ZERO;
      if (nowPrice.isZero()) {
        midPrice = prevPrice;
      } else {
        midPrice = prevPrice.plus(nowPrice.toBigDecimal().div(DECIMAL30)).div(BigDecimal.fromString('2'));
      }
      if (market == targetMarket) {
        userLiquidity.lps[i] = userLiquidity.lps[i].plus(value);
        foundTarget = true;
      }
      gainedPointBase = gainedPointBase.plus(lp.toBigDecimal().times(midPrice).times(pointsIndex));
    }
    userLiquidity.basePoints = userLiquidity.basePoints.plus(gainedPointBase);
  }
  // update
  userLiquidity.latestUpdateTimestamp = timestamp;
  if (!foundTarget) {
    const nowPrice = getMarketTokenPrice(targetMarket, timestamp);
    const lps = userLiquidity.lps;
    lps.push(value);
    userLiquidity.lps = lps;
    const markets = userLiquidity.markets;
    markets.push(targetMarket);
    userLiquidity.markets = markets;
    const prices = userLiquidity.marketPrices;
    prices.push(nowPrice.toBigDecimal().div(DECIMAL30));
    userLiquidity.marketPrices = prices;
  }
  userLiquidity.save();
  createUserLiquiditySnap(account, userLiquidity.latestUpdateTimestamp, userLiquidity.lps, userLiquidity.markets, userLiquidity.marketPrices ,userLiquidity.basePoints);
  // FIXME: for modemax
  // const userData = loadOrCreateUserStat(account);
  // userData.lp = userLiquidity.lp.div(DECIMAL18);
  // userData.save();
}