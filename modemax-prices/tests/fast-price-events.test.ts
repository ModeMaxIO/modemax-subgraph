import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { PriceUpdate } from "../generated/schema"
import { PriceUpdate as PriceUpdateEvent } from "../generated/FastPriceEvents/FastPriceEvents"
import { handlePriceUpdate } from "../src/fast-price-events"
import { createPriceUpdateEvent } from "./fast-price-events-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let token = Address.fromString("0x0000000000000000000000000000000000000001")
    let price = BigInt.fromI32(234)
    let priceFeed = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newPriceUpdateEvent = createPriceUpdateEvent(token, price, priceFeed)
    handlePriceUpdate(newPriceUpdateEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("PriceUpdate created and stored", () => {
    assert.entityCount("PriceUpdate", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "PriceUpdate",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "token",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "PriceUpdate",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "price",
      "234"
    )
    assert.fieldEquals(
      "PriceUpdate",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "priceFeed",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
