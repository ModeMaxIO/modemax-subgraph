import {
  EventLog1 as EventLog1Event,
} from "../generated/EventEmitter/EventEmitter"
import { getAddressItem, getAddressString, getUintItem } from "./event-emitter-helper"
import { loadOrCreateMarketToken } from "./schema";
import { MarketTokenTemplate } from "../generated/templates";
import { createUserTradeSnap, loadOrCreateTokenPrice, loadOrCreateUserStat } from "./event-emitter-schema-helper";
import { DECIMAL30 } from "./const";
import { storeReferralOfUserStat } from "./schema-helper";


export function handleEventLog1(event: EventLog1Event): void {
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
    const sizeDeltaUsd = getUintItem("sizeDeltaUsd", event.params.eventData);
    const userStat = loadOrCreateUserStat(account);
    const trade = sizeDeltaUsd.toBigDecimal().div(DECIMAL30);
    userStat.trade = userStat.trade.plus(trade);
    userStat.save();
    storeReferralOfUserStat(account, sizeDeltaUsd);
    createUserTradeSnap(account, event.transaction.hash.toHexString(), event.logIndex, event.block.timestamp, trade)
    return;
  }
}

