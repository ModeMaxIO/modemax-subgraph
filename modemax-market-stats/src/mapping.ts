import {
  BigInt,
  log
} from '@graphprotocol/graph-ts'

import {
  IncreasePosition as IncreasePositionEvent,
  DecreasePosition as DecreasePositionEvent,
  LiquidatePosition as LiquidatePositionEvent,
  UpdatePosition as UpdatePositionEvent,
} from '../generated/Vault2/Vault'
import {Position} from '../generated/schema'
import {AddLiquidity, RemoveLiquidity} from "../generated/GlpManager/GlpManager";
import {
  EventLog1,
  EventLog1EventDataStruct,
} from "../generated/EventEmitter/EventEmitter";
import {getAddressItem, getAddressString, getIntItem, getUintItem} from "./eventLog1Data";
import {Transfer} from "../generated/templates/MarketTokenTemplate/MarketToken";
import {storeLeaderboard, storeLeaderboardV2} from "./leaderBoardMapping";
import {storeActivityInfo, storeUserData} from "./airdropMapping";
import {PriceUpdate} from "../generated/FastPriceEvents/FastPriceEvents";
import {MarketTokenTemplate} from "../generated/templates";

let ZERO = BigInt.zero();
let ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export function handleIncreasePosition(event: IncreasePositionEvent): void {
  let positionId = event.params.key.toHexString()
  let position = Position.load(positionId)
  if (position == null) {
    position = new Position(positionId)
    position.key = event.params.key
    position.account = event.params.account
    position.timestamp = event.block.timestamp.toI32()
  }
  position.save()

  storeLeaderboard(
      event.params.account.toHexString(),
      "increasePosition",
      event.params.sizeDelta,
      event.params.collateralDelta,
      event.block.timestamp
  )
  storeUserData(
      "increasePosition",
      position.account.toHexString(),
      ZERO,
      ZERO,
      event.params.sizeDelta,
      event.block.timestamp
  )
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  let positionId = event.params.key.toHexString()
  let position = Position.load(positionId)
  if (position == null) {
    position = new Position(positionId)
    position.key = event.params.key
    position.account = event.params.account
    position.timestamp = event.block.timestamp.toI32()
  }
  position.save()

  storeLeaderboard(
      position.account.toHexString(),
      "decreasePosition",
      event.params.sizeDelta,
      event.params.collateralDelta,
      event.block.timestamp
  )
  storeUserData(
      "decreasePosition",
      event.params.account.toHexString(),
      ZERO,
      ZERO,
      event.params.sizeDelta,
      event.block.timestamp
  )
}

export function handleUpdatePosition(event: UpdatePositionEvent): void {
  // position.account is set by listening IncreasePosition or DecreasePosition events
  let positionId = event.params.key.toHexString();
  let position = Position.load(positionId);
  if (position != null) {
    storeLeaderboard(
        position.account.toHexString(),
        "updatePosition",
        event.params.realisedPnl,
        ZERO,
        event.block.timestamp
    )

    storeUserData(
        "updatePosition",
        position.account.toHexString(),
        ZERO,
        event.params.realisedPnl,
        ZERO,
        event.block.timestamp
    )
  }
}

export function handleClosePosition(event: UpdatePositionEvent): void {
  let positionId = event.params.key.toHexString();
  let position = Position.load(positionId);
  if (position != null) {
    storeLeaderboard(
        position.account.toHexString(),
        "closePosition",
        event.params.realisedPnl,
        ZERO,
        event.block.timestamp
    )

    storeUserData(
        "closePosition",
        position.account.toHexString(),
        ZERO,
        event.params.realisedPnl,
        ZERO,
        event.block.timestamp
    )
  }
}

export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
  storeLeaderboard(
      event.params.account.toHexString(),
      "liquidatePosition",
      event.params.realisedPnl,
      ZERO,
      event.block.timestamp
  )

  storeUserData(
      "liquidatePosition",
      event.params.account.toHexString(),
      ZERO,
      event.params.realisedPnl,
      ZERO,
      event.block.timestamp
  )
}

export function handleAddLiquidity(event: AddLiquidity): void {
  storeLeaderboard(
      event.params.account.toHexString(),
      "addLiquidity",
      event.params.mintAmount,
      ZERO,
      event.block.timestamp
  )

  storeUserData(
      "addLiquidity",
      event.params.account.toHexString(),
      event.params.mintAmount,
      ZERO,
      ZERO,
      event.block.timestamp
  )
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  storeLeaderboard(
      event.params.account.toHexString(),
      "removeLiquidity",
      event.params.glpAmount,
      ZERO,
      event.block.timestamp
  )

  storeUserData(
      "removeLiquidity",
      event.params.account.toHexString(),
      event.params.glpAmount.neg(),
      ZERO,
      ZERO,
      event.block.timestamp
  )
}

export function handleEventLog1(event: EventLog1): void {
  let eventName = event.params.eventName;
  let eventData = event.params.eventData;

  if (eventName == "MarketCreated") {
    let marketToken = getAddressItem("marketToken",eventData)!
    MarketTokenTemplate.create(marketToken);
    return;
  }

  if (eventName == "PositionIncrease") {
    let account = getAddressString("account",eventData)!;
    let sizeDeltaUsd = getUintItem("sizeDeltaUsd", eventData);
    let netProfit = getIntItem("basePnlUsd", eventData);
    storeLeaderboardV2(
        account,
        "increasePosition",
        eventData,
        ZERO,
        event.block.timestamp
    )
    storeUserData(
        "increasePosition",
        account,
        ZERO,
        netProfit,
        sizeDeltaUsd,
        event.block.timestamp
    )
    return;
  }

  if (eventName == "PositionDecrease") {
    let account = getAddressString("account", eventData)!;
    let sizeDeltaUsd = getUintItem("sizeDeltaUsd", eventData);
    let netProfit = getIntItem("basePnlUsd", eventData);

    // log.error("----handleEventLog1----decreasePosition----{} {}:", [sizeDeltaUsd.toString(), netProfit.toString()])
    storeLeaderboardV2(
        account,
        "decreasePosition",
        eventData,
        ZERO,
        event.block.timestamp
    )
    storeUserData(
        "decreasePosition",
        account,
        ZERO,
        netProfit,
        sizeDeltaUsd,
        event.block.timestamp
    )
    return;
  }
}

export function handleMarketTokenTransfer(event: Transfer): void {
  let from = event.params.from.toHexString();
  let to = event.params.to.toHexString();
  let value = event.params.value;
  let eventData = new EventLog1EventDataStruct();
  if (from != ADDRESS_ZERO) {
    storeLeaderboardV2(from,"liquidity",eventData,value.neg(),event.block.timestamp);
    // airdrop does not require statistical CP data
    // storeUserData(
    //     "removeLiquidity",
    //     from,
    //     value.neg(),
    //     ZERO,
    //     ZERO,
    //     event.block.timestamp
    // )
  }
  if (to != ADDRESS_ZERO) {
    storeLeaderboardV2(to,"liquidity",eventData,value,event.block.timestamp);
    // airdrop does not require statistical CP data
    // storeUserData(
    //     "addLiquidity",
    //     to,
    //     value,
    //     ZERO,
    //     ZERO,
    //     event.block.timestamp
    // )
  }
}

export function handlePriceUpdate(event: PriceUpdate): void {
  storeActivityInfo();
}
