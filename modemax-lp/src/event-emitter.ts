import {
  EventLog1 as EventLog1Event,
} from "../generated/EventEmitter/EventEmitter"
import { getAddressItem, getAddressString, getIntItem, getUintItem } from "./event-emitter-helper"
import { loadOrCreateMarketToken } from "./schema";
import { MarketTokenTemplate } from "../generated/templates";
import { createUserTradeSnap, loadOrCreateTokenPrice, loadOrCreateUserStat, saveCollateralPrice } from "./event-emitter-schema-helper";
import { DECIMAL30 } from "./const";
import { ignoreOrCreateLeaderboardSnapOfPrevDay, loadOrCreateLeaderboard, storeReferralOfUserStat, storeUserCollateral } from "./schema-helper";
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";


export function handleEventLog1(event: EventLog1Event): void {
  const timestamp = event.block.timestamp.toI32();
  if (event.params.eventName == "MarketCreated") {
    let marketTokenAddress = getAddressItem("marketToken", event.params.eventData);
    if (marketTokenAddress) {
      loadOrCreateMarketToken(
        marketTokenAddress,
        getAddressItem("indexToken", event.params.eventData)!.toHexString(),
        getAddressItem("longToken", event.params.eventData)!.toHexString(),
        getAddressItem("shortToken", event.params.eventData)!.toHexString(),
      );
      MarketTokenTemplate.create(marketTokenAddress);
    }
    return;
  }
  if (event.params.eventName == "OraclePriceUpdate") {
    const tokenPrice = loadOrCreateTokenPrice(getAddressItem("token", event.params.eventData)!.toHexString());
    tokenPrice.minPrice = getUintItem("minPrice", event.params.eventData);
    tokenPrice.maxPrice = getUintItem("maxPrice", event.params.eventData);
    tokenPrice.save();
    return;
  }
  if (event.params.eventName == "SwapInfo") {
    const account = getAddressString("receiver", event.params.eventData)!;
    const price = getUintItem('tokenInPrice', event.params.eventData);
    const amount = getUintItem('amountIn', event.params.eventData);
    const userStat = loadOrCreateUserStat(account);
    userStat.swap = userStat.swap.plus(price.times(amount).toBigDecimal().div(DECIMAL30));
    userStat.save();
    return;
  }
  if (event.params.eventName == "PositionIncrease" || event.params.eventName == "PositionDecrease") {
    const account = getAddressString("account", event.params.eventData)!;
    const collateralToken = getAddressString("collateralToken", event.params.eventData)!
    const sizeDeltaUsd = getUintItem("sizeDeltaUsd", event.params.eventData);
    const netProfit = getIntItem("basePnlUsd", event.params.eventData);
    const collateralTokenPriceMin = getUintItem("collateralTokenPrice.min", event.params.eventData);
    const collateralTokenPriceMax = getUintItem("collateralTokenPrice.max", event.params.eventData);
    const collateralAmount = getIntItem("collateralDeltaAmount", event.params.eventData);

    const userStat = loadOrCreateUserStat(account);
    const trade = sizeDeltaUsd.toBigDecimal().div(DECIMAL30);
    userStat.trade = userStat.trade.plus(trade);
    userStat.save();
    storeReferralOfUserStat(account, sizeDeltaUsd);
    createUserTradeSnap(account, event.transaction.hash.toHexString(), event.logIndex, event.block.timestamp, trade)
    const collateralMidPrice = collateralTokenPriceMax.plus(collateralTokenPriceMin).toBigDecimal().div(BigDecimal.fromString('2'));
    storeUserCollateral(account, timestamp,
      collateralToken,
      event.params.eventName == 'PositionIncrease' ? collateralAmount : collateralAmount.neg(),
    );
    saveCollateralPrice(collateralToken, collateralMidPrice, timestamp);
    {
      ignoreOrCreateLeaderboardSnapOfPrevDay(account, timestamp);
      const leaderboard = loadOrCreateLeaderboard(account);
      const sizeDeltaUsd_BD = sizeDeltaUsd.toBigDecimal().div(DECIMAL30)
      const netProfit_BD = netProfit.toBigDecimal().div(DECIMAL30);
      if (event.params.eventName == "PositionIncrease") {
        leaderboard.margin = leaderboard.margin.plus(sizeDeltaUsd_BD);
      } else {
        // PositionDecrease
        leaderboard.margin = leaderboard.margin.minus(sizeDeltaUsd_BD);
      }
      leaderboard.tradingVolume = leaderboard.tradingVolume.plus(sizeDeltaUsd_BD);
      leaderboard.netProfit = leaderboard.netProfit.plus(netProfit_BD);
      leaderboard.latestUpdateTimestamp = timestamp;
      leaderboard.save();
    }

    return;
  }
}

