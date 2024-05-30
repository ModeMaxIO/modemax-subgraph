import {
  Address,
  BigInt, Bytes,
  log
} from '@graphprotocol/graph-ts'
import {
  IncreasePosition as IncreasePositionEvent,
  DecreasePosition as DecreasePositionEvent,
  LiquidatePosition as LiquidatePositionEvent,
  UpdatePosition as UpdatePositionEvent,
} from '../generated/Vault2/Vault'
import {Position, ReferralCode, TraderToReferralCode} from '../generated/schema'
import {AddLiquidity, RemoveLiquidity} from "../generated/GlpManager/GlpManager";
import {
  EventLog1,
  EventLog1EventDataStruct,
} from "../generated/EventEmitter/EventEmitter";
import {getAddressItem, getAddressString, getIntItem, getUintItem} from "./eventLog1Data";
import {Transfer} from "../generated/templates/MarketTokenTemplate/MarketToken";
import {storeLeaderboard, storeLeaderboardV2} from "./leaderBoard";
import {saveReferalPositionRaw, storeUserData} from "./airdrop";
import {MarketTokenTemplate} from "../generated/templates";
import {
  GovSetCodeOwner,
  RegisterCode,
  SetCodeOwner,
  SetTraderReferralCode
} from "../generated/ReferralStorage/ReferralStorage";

let ZERO = BigInt.zero();
let ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export function handleIncreasePosition(event: IncreasePositionEvent): void {
  let positionId = event.params.key.toHexString()
  let position = Position.load(positionId)
  let account = event.params.account
  if (position == null) {
    position = new Position(positionId)
    position.key = event.params.key
    position.account = account
    position.timestamp = event.block.timestamp.toI32()
  }
  position.save()

  storeLeaderboard(
      account.toHexString(),
      "increasePosition",
      event.params.sizeDelta,
      event.params.collateralDelta,
      event.block.timestamp
  )
  storeUserData(
      "increasePosition",
      account.toHexString(),
      ZERO,
      ZERO,
      event.params.sizeDelta,
      event.block.timestamp
  )

  let referralCode = _getReferralCode(account.toHexString())
  if(referralCode!=""){
    let owner = _getOwner(account.toHexString(),referralCode)
    if (owner!=""){
      storeUserData("referralIncreasePosition",owner,ZERO,ZERO,event.params.sizeDelta,event.block.timestamp)
      saveReferalPositionRaw(
          event.transaction.hash.toHexString() + ":" + event.logIndex.toString(),
          account.toHexString(),
          owner,
          referralCode.toString(),
          true,
          event.params.sizeDelta,
          event.block.timestamp,
          "V1"
      )
    }
  }
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  let positionId = event.params.key.toHexString()
  let position = Position.load(positionId)
  let account = event.params.account
  if (position == null) {
    position = new Position(positionId)
    position.key = event.params.key
    position.account = account
    position.timestamp = event.block.timestamp.toI32()
  }
  position.save()

  storeLeaderboard(
      account.toHexString(),
      "decreasePosition",
      event.params.sizeDelta,
      event.params.collateralDelta,
      event.block.timestamp
  )
  storeUserData(
      "decreasePosition",
      account.toHexString(),
      ZERO,
      ZERO,
      event.params.sizeDelta,
      event.block.timestamp
  )

  let referralCode = _getReferralCode(account.toHexString());
  if(referralCode!=""){
    let owner = _getOwner(account.toHexString(),referralCode)
    if (owner!=""){
      storeUserData("referralDecreasePosition",owner,ZERO,ZERO,event.params.sizeDelta,event.block.timestamp)
      saveReferalPositionRaw(
          event.transaction.hash.toHexString() + ":" + event.logIndex.toString(),
          account.toHexString(),
          owner,
          referralCode.toString(),
          false,
          event.params.sizeDelta,
          event.block.timestamp,
          "V1"
      )
    }
  }
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

//V2
export function handleEventLog1(event: EventLog1): void {
  let eventName = event.params.eventName;
  let eventData = event.params.eventData;

  if (eventName == "MarketCreated") {
    let marketToken = getAddressItem("marketToken",eventData)!
    MarketTokenTemplate.create(marketToken);
    return;
  }
  if (eventName == "PositionIncrease" || eventName == "PositionDecrease") {
    let account = getAddressString("account",eventData)!;
    let sizeDeltaUsd = getUintItem("sizeDeltaUsd", eventData);
    let netProfit = getIntItem("basePnlUsd", eventData);
    let actionType = eventName == "PositionIncrease"?"increasePosition":"decreasePosition"
    let timestamp = event.block.timestamp;

    storeLeaderboardV2(
        account,
        actionType,
        eventData,
        ZERO,
        timestamp
    )
    storeUserData(
        actionType,
        account,
        ZERO,
        netProfit,
        sizeDeltaUsd,
        timestamp
    )

    let referralActionType = eventName == "PositionIncrease"?"referralIncreasePosition":"referralDecreasePosition"
    let referralCode = _getReferralCode(account);
    if (referralCode!=""){
      let owner = _getOwner(account,referralCode)
      if (owner!=""){
        storeUserData(referralActionType,owner,ZERO,ZERO,sizeDeltaUsd,timestamp)
        saveReferalPositionRaw(
            event.transaction.hash.toHexString() + ":" + event.logIndex.toString(),
            account,
            owner,
            referralCode.toString(),
            eventName == "PositionIncrease",
            sizeDeltaUsd,
            event.block.timestamp,
            "V2"
        )
      }
    }
  }
  return;
}

export function handleMarketTokenTransfer(event: Transfer): void {
  let from = event.params.from.toHexString();
  let to = event.params.to.toHexString();
  let value = event.params.value;
  let eventData = new EventLog1EventDataStruct();
  if (from != ADDRESS_ZERO) {
    storeLeaderboardV2(from,"liquidity",eventData,value.neg(),event.block.timestamp);
    storeUserData(
        "removeLiquidity",
        from,
        value.neg(),
        ZERO,
        ZERO,
        event.block.timestamp
    )
  }
  if (to != ADDRESS_ZERO) {
    storeLeaderboardV2(to,"liquidity",eventData,value,event.block.timestamp);
    storeUserData(
        "addLiquidity",
        to,
        value,
        ZERO,
        ZERO,
        event.block.timestamp
    )
  }
}

export function handleRegisterCode(event: RegisterCode): void {
  _saveReferralCode(event.block.timestamp,event.params.code, event.params.account)
}

export function handleGovSetCodeOwner(event: GovSetCodeOwner): void {
  let referralCodeEntity = ReferralCode.load(event.params.code.toHexString());
  if (referralCodeEntity == null) {
    _saveReferralCode(
        event.block.timestamp,
        event.params.code,
        event.params.newAccount
    );
  } else {
    referralCodeEntity.owner = event.params.newAccount.toHexString();
    referralCodeEntity.save();
  }
}

export function handleSetCodeOwner(event: SetCodeOwner): void {
  let referralCodeEntity = ReferralCode.load(event.params.code.toHexString());
  if (referralCodeEntity == null) {
    _saveReferralCode(
        event.block.timestamp,
        event.params.code,
        event.params.newAccount
    );
  } else {
    referralCodeEntity.owner = event.params.newAccount.toHexString();
    referralCodeEntity.save();
  }
}

export function handleSetTraderReferralCode(
    event: SetTraderReferralCode
): void {
  let referralCodeEntity = ReferralCode.load(event.params.code.toHexString());
  if (referralCodeEntity == null) {
    return;
  }
  let traderToReferralCode = new TraderToReferralCode(
      event.params.account.toHexString()
  );
  traderToReferralCode.referralCode = event.params.code.toHexString();
  traderToReferralCode.save();
}

function _saveReferralCode(timestamp: BigInt, code: Bytes, owner: Address):void{
  let referralCodeEntity = new ReferralCode(code.toHexString());
  referralCodeEntity.owner = owner.toHexString();
  referralCodeEntity.code = code.toHex();
  referralCodeEntity.save();
}

function _getOwner(account: string,referralCode:string):string{
  let owner = ""
  if (referralCode == "") {
    owner = "";
  }else{
    let referralCodeEntity = ReferralCode.load(referralCode);
    if (referralCodeEntity!=null) {
      let affiliate = referralCodeEntity.owner;
      if (affiliate!=account){
        owner = affiliate;
      }
    }
  }
  return owner;
}

function _getReferralCode(account:string) :string{
  let traderToReferralCode = TraderToReferralCode.load(account);
  if (traderToReferralCode == null) {
    return "";
  }
  let referralCode = traderToReferralCode.referralCode
  if(referralCode == null){
    return "";
  }
  return referralCode.toString();
}
