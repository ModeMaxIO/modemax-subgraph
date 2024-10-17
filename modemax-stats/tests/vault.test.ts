import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { BuyUSDG } from "../generated/schema"
import { BuyUSDG as BuyUSDGEvent } from "../generated/Vault/Vault"
import { handleBuyUSDG } from "../src/vault"
import { createBuyUSDGEvent } from "./vault-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let account = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let token = Address.fromString("0x0000000000000000000000000000000000000001")
    let tokenAmount = BigInt.fromI32(234)
    let usdgAmount = BigInt.fromI32(234)
    let feeBasisPoints = BigInt.fromI32(234)
    let newBuyUSDGEvent = createBuyUSDGEvent(
      account,
      token,
      tokenAmount,
      usdgAmount,
      feeBasisPoints
    )
    handleBuyUSDG(newBuyUSDGEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("BuyUSDG created and stored", () => {
    assert.entityCount("BuyUSDG", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "BuyUSDG",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "account",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "BuyUSDG",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "token",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "BuyUSDG",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "tokenAmount",
      "234"
    )
    assert.fieldEquals(
      "BuyUSDG",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "usdgAmount",
      "234"
    )
    assert.fieldEquals(
      "BuyUSDG",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "feeBasisPoints",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
