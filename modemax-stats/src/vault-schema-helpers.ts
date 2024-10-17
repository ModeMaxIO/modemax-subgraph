import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { ActivePosition, FeeStat, FundingRate, LiquidatedPosition, OpenInterestByToken, TokenStat, TradingStat, UserData, UserStat, VolumeStat } from "../generated/schema"
import { getDayId, getWeekId, timestampToPeriod } from "./utils"
import { BI_ZERO, FUNDING_PRECISION, TRADE_TYPES } from "./const"

export function loadOrCreateTradingStat(id: string, period: string, timestamp: BigInt): TradingStat {
  let entity = TradingStat.load(id)
  if (entity == null) {
    entity = new TradingStat(id)
    entity.period = period
    entity.profit = BigInt.fromI32(0)
    entity.loss = BigInt.fromI32(0)
    entity.profitCumulative = BigInt.fromI32(0)
    entity.lossCumulative = BigInt.fromI32(0)

    entity.longOpenInterest = BigInt.fromI32(0)
    entity.shortOpenInterest = BigInt.fromI32(0)

    entity.liquidatedCollateral = BigInt.fromI32(0)
    entity.liquidatedCollateralCumulative = BigInt.fromI32(0)
  }
  entity.timestamp = timestamp.toI32()
  return entity as TradingStat
}

export function loadOrCreateTokenStat(
  timestamp: BigInt,
  period: string,
  token: Address
): TokenStat {
  let id: string
  let timestampGroup: BigInt
  if (period == 'total') {
    id = 'total:' + token.toHexString()
    timestampGroup = timestamp
  } else {
    timestampGroup = timestampToPeriod(timestamp, period)
    id = timestampGroup.toString() + ':' + period + ':' + token.toHexString()
  }

  let entity = TokenStat.load(id)
  if (entity == null) {
    entity = new TokenStat(id)
    entity.timestamp = timestampGroup.toI32()
    entity.period = period
    entity.token = token.toHexString()
    entity.poolAmount = BigInt.fromI32(0)
    entity.poolAmountUsd = BigInt.fromI32(0)
    entity.reservedAmountUsd = BigInt.fromI32(0)
    entity.reservedAmount = BigInt.fromI32(0)
    entity.usdgAmount = BigInt.fromI32(0)
  }
  return entity as TokenStat
}

export function loadOrCreateOpenInterestByToken(id: string, period: string, timestamp: BigInt, indexToken: Address): OpenInterestByToken {
  let entity = OpenInterestByToken.load(id)
  if (entity == null) {
    entity = new OpenInterestByToken(id)
    entity.period = period
    entity.long = BI_ZERO
    entity.short = BI_ZERO
    entity.token = indexToken.toHexString()
  }
  entity.timestamp = timestamp.toI32()
  return entity as OpenInterestByToken;
}

export function loadOrCreateVolumeStat(id: string, period: string): VolumeStat {
  let entity = VolumeStat.load(id)
  if (!entity) {
    entity = new VolumeStat(id)
    entity.margin = BI_ZERO
    entity.swap = BI_ZERO
    entity.liquidation = BI_ZERO
    entity.mint = BI_ZERO
    entity.burn = BI_ZERO
    entity.period = period
  }
  return entity as VolumeStat
}

export function loadOrCreateFeeStat(id: string, period: string): FeeStat {
  let entity = FeeStat.load(id)
  if (entity === null) {
    entity = new FeeStat(id)
    for (let i = 0; i < TRADE_TYPES.length; i++) {
      let _type = TRADE_TYPES[i]
      entity.setBigInt(_type, BI_ZERO)
    }
    entity.period = period
  }
  return entity as FeeStat
}

export function storeUserAction(
  timestamp: BigInt,
  account: Address,
  actionType: string
): void {
  let totalEntity = _storeUserActionByType(
    timestamp,
    account,
    actionType,
    'total',
    null
  )

  _storeUserActionByType(timestamp, account, actionType, 'daily', totalEntity)
  _storeUserActionByType(timestamp, account, actionType, 'weekly', totalEntity)
}

function _storeUserActionByType(
  timestamp: BigInt,
  account: Address,
  actionType: string,
  period: string,
  userStatTotal: UserStat | null
): UserStat {
  let timestampId =
    period == 'weekly' ? getWeekId(timestamp) : getDayId(timestamp)
  let userId =
    period == 'total'
      ? account.toHexString()
      : period + ':' + timestampId + ':' + account.toHexString()
  let user = UserData.load(userId)

  let statId = period == 'total' ? 'total' : period + ':' + timestampId
  let userStat = UserStat.load(statId)
  if (userStat == null) {
    userStat = new UserStat(statId)
    userStat.period = period
    userStat.timestamp = parseInt(timestampId) as i32

    userStat.uniqueCount = 0
    userStat.uniqueMarginCount = 0
    userStat.uniqueSwapCount = 0
    userStat.uniqueMintBurnCount = 0

    userStat.uniqueCountCumulative = 0
    userStat.uniqueMarginCountCumulative = 0
    userStat.uniqueSwapCountCumulative = 0
    userStat.uniqueMintBurnCountCumulative = 0

    userStat.actionCount = 0
    userStat.actionMarginCount = 0
    userStat.actionSwapCount = 0
    userStat.actionMintBurnCount = 0
  }

  if (user == null) {
    user = new UserData(userId)
    user.period = period
    user.timestamp = parseInt(timestampId) as i32

    user.actionSwapCount = 0
    user.actionMarginCount = 0
    user.actionMintBurnCount = 0

    userStat.uniqueCount = userStat.uniqueCount + 1

    if (period == 'total') {
      userStat.uniqueCountCumulative = userStat.uniqueCount
    } else if (userStatTotal != null) {
      userStat.uniqueCountCumulative = userStatTotal.uniqueCount
    }
  }

  userStat.actionCount += 1

  let actionCountProp: string = '';
  let uniqueCountProp: string = '';
  if (actionType == 'margin') {
    actionCountProp = 'actionMarginCount'
    uniqueCountProp = 'uniqueMarginCount'
  } else if (actionType == 'swap') {
    actionCountProp = 'actionSwapCount'
    uniqueCountProp = 'uniqueSwapCount'
  } else if (actionType == 'mintBurn') {
    actionCountProp = 'actionMintBurnCount'
    uniqueCountProp = 'uniqueMintBurnCount'
  }
  let uniqueCountCumulativeProp = uniqueCountProp + 'Cumulative'

  if (user.getI32(actionCountProp) == 0) {
    userStat.setI32(uniqueCountProp, userStat.getI32(uniqueCountProp) + 1)
  }
  user.setI32(actionCountProp, user.getI32(actionCountProp) + 1)
  userStat.setI32(actionCountProp, userStat.getI32(actionCountProp) + 1)

  if (period == 'total') {
    userStat.setI32(uniqueCountCumulativeProp, userStat.getI32(uniqueCountProp))
  } else if (userStatTotal != null) {
    userStat.setI32(
      uniqueCountCumulativeProp,
      userStatTotal.getI32(uniqueCountProp)
    )
  }

  user.save()
  userStat.save()

  return userStat as UserStat
}

export function storeLiquidatedPosition(
  keyBytes: Bytes,
  timestamp: BigInt,
  account: Address,
  indexToken: Address,
  size: BigInt,
  collateralToken: Address,
  collateral: BigInt,
  isLong: boolean,
  type: string,
  markPrice: BigInt
): void {

  let key = keyBytes.toHexString()
  let position = ActivePosition.load(key)

  if (position != null) {
    let averagePrice = position.averagePrice

    let id = key + ':' + timestamp.toString()
    let liquidatedPosition = new LiquidatedPosition(id)
    liquidatedPosition.account = account.toHexString()
    liquidatedPosition.timestamp = timestamp.toI32()
    liquidatedPosition.indexToken = indexToken.toHexString()
    liquidatedPosition.size = size
    liquidatedPosition.collateralToken = collateralToken.toHexString()
    liquidatedPosition.collateral = position.collateral
    liquidatedPosition.isLong = isLong
    liquidatedPosition.type = type
    liquidatedPosition.key = key
    liquidatedPosition.markPrice = markPrice
    liquidatedPosition.averagePrice = averagePrice
    let priceDelta = isLong ? averagePrice.minus(markPrice) : markPrice.minus(averagePrice)
    liquidatedPosition.loss = (size.times(priceDelta)).div(averagePrice)
    let fundingRateId = _getFundingRateId('total', collateralToken)
    let fundingRateEntity = FundingRate.load(fundingRateId)
    if (fundingRateEntity) {
      let accruedFundingRate =
        BigInt.fromI32(fundingRateEntity.endFundingRate).minus(position.entryFundingRate)
      liquidatedPosition.borrowFee = (accruedFundingRate.times(size)).div(FUNDING_PRECISION)
    }
    liquidatedPosition.save()
  }
}

function _getFundingRateId(timeKey: string, token: Address): string {
  return timeKey + ':' + token.toHexString()
}

export function loadOrCreateActivePosition(key: string): ActivePosition {
  let entity = new ActivePosition(key)
  if (entity) {
    entity.averagePrice = BI_ZERO
    entity.entryFundingRate = BI_ZERO
    entity.collateral = BI_ZERO
    entity.size = BI_ZERO
    entity.account = ''
    entity.isLong = false;
    entity.collateralToken = '';
    entity.indexToken = '';
    entity.timestamp = 0;
    entity.isActive = false;
    entity.save()
  }
  return entity;
}