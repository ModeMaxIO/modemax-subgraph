import {
  EventLog1 as EventLog1Event,
} from "../generated/EventEmitter/EventEmitter"
import { getAddressItem, getAddressString, getUintItem } from "./event-emitter-helper"
import { loadOrCreateMarketToken } from "./schema";
import { MarketTokenTemplate } from "../generated/templates";
import { loadOrCreateUserStat } from "./event-emitter-schema-helper";
import { DECIMAL30 } from "./const";
import { storeReferralOfUserStat } from "./schema-helper";


export function handleEventLog1(event: EventLog1Event): void {
  if (event.params.eventName == "MarketCreated") {
    let marketTokenAddress = getAddressItem("marketToken", event.params.eventData);
    if (marketTokenAddress) {
      loadOrCreateMarketToken(marketTokenAddress);
      MarketTokenTemplate.create(marketTokenAddress);
    }
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
    userStat.trade = userStat.trade.plus(sizeDeltaUsd.toBigDecimal().div(DECIMAL30));
    userStat.save();
    storeReferralOfUserStat(account, sizeDeltaUsd);
    return;
  }
}

