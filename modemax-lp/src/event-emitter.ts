import {
  EventLog1 as EventLog1Event,
} from "../generated/EventEmitter/EventEmitter"
import { getAddressItem } from "./event-emitter-helper"
import { loadOrCreateMarketToken } from "./schema";
import { MarketTokenTemplate } from "../generated/templates";


export function handleEventLog1(event: EventLog1Event): void {
  if (event.params.eventName == "MarketCreated") {
    let marketTokenAddress = getAddressItem("marketToken", event.params.eventData);
    if (marketTokenAddress) {
      loadOrCreateMarketToken(marketTokenAddress);
      MarketTokenTemplate.create(marketTokenAddress);
      return
    }
  }
}

