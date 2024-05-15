import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import { PriceUpdate } from "../generated/FastPriceEvents/FastPriceEvents"

export function createPriceUpdateEvent(
  token: Address,
  price: BigInt,
  priceFeed: Address
): PriceUpdate {
  let priceUpdateEvent = changetype<PriceUpdate>(newMockEvent())

  priceUpdateEvent.parameters = new Array()

  priceUpdateEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  priceUpdateEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  priceUpdateEvent.parameters.push(
    new ethereum.EventParam("priceFeed", ethereum.Value.fromAddress(priceFeed))
  )

  return priceUpdateEvent
}
