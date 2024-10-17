import { Address, BigInt, dataSource } from "@graphprotocol/graph-ts"
import {
  BuyUSDG as BuyUSDGEvent,
  ClosePosition as ClosePositionEvent,
  CollectMarginFees as CollectMarginFeesEvent,
  CollectSwapFees as CollectSwapFeesEvent,
  // DecreaseGuaranteedUsd as DecreaseGuaranteedUsdEvent,
  DecreasePoolAmount as DecreasePoolAmountEvent,
  DecreasePosition as DecreasePositionEvent,
  DecreaseReservedAmount as DecreaseReservedAmountEvent,
  DecreaseUsdgAmount as DecreaseUsdgAmountEvent,
  // DirectPoolDeposit as DirectPoolDepositEvent,
  // IncreaseGuaranteedUsd as IncreaseGuaranteedUsdEvent,
  IncreasePoolAmount as IncreasePoolAmountEvent,
  IncreasePosition as IncreasePositionEvent,
  IncreaseReservedAmount as IncreaseReservedAmountEvent,
  IncreaseUsdgAmount as IncreaseUsdgAmountEvent,
  LiquidatePosition as LiquidatePositionEvent,
  SellUSDG as SellUSDGEvent,
  Swap as SwapEvent,
  UpdateFundingRate as UpdateFundingRateEvent,
  // UpdatePnl as UpdatePnlEvent,
  UpdatePosition as UpdatePositionEvent,
  Vault as VaultContract
} from "../generated/Vault/Vault"
import { ERC20 as ERC20Contract } from "../generated/Vault/ERC20";
import { ActionDecreasePositionLong, ActionDecreasePositionShort, ActionIncreasePositionLong, ActionIncreasePositionShort, ActionLiquidatePositionLong, ActionLiquidatePositionShort, ActionSellUSDG, ActionSwap, BASIS_POINTS_DIVISOR, BI_ZERO, LIQUIDATOR_ADDRESS, TRADE_TYPES } from "./const"
import { getDayId, getHourId, timestampToDay } from "./utils"
import {
  loadOrCreateActivePosition,
  loadOrCreateFeeStat, loadOrCreateOpenInterestByToken, loadOrCreateTokenStat, loadOrCreateTradingStat, loadOrCreateVolumeStat, storeLiquidatedPosition, storeUserAction
} from "./vault-schema-helpers"
import { Action, ActivePosition, ClosePosition, CollectMarginFee, CollectSwapFee, DecreasePosition, FundingRate, HourlyFee, HourlyVolume, HourlyVolumeBySource, HourlyVolumeByToken, IncreasePosition, LiquidatePosition, Swap, Token, Transaction, UpdatePosition } from "../generated/schema"


export function handleBuyUSDG(event: BuyUSDGEvent): void {
  let volume = event.params.usdgAmount.times(BigInt.fromString('1000000000000'))
  _storeVolume('mint', event.block.timestamp, volume)
  _storeVolumeBySource(
    'mint',
    event.block.timestamp,
    event.transaction.to!,
    // Address.fromString(''),
    volume
  )

  let fee = (volume.times(event.params.feeBasisPoints)).div(BASIS_POINTS_DIVISOR)
  _storeFees('mint', event.block.timestamp, fee)
  storeUserAction(event.block.timestamp, event.params.account, 'mintBurn')
}

export function handleClosePosition(event: ClosePositionEvent): void {
  _storePnl(event.block.timestamp, event.params.realisedPnl, false)
  // From raw
  {
    let id = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
    let entity = new ClosePosition(id)

    entity.key = event.params.key.toHexString()
    entity.size = event.params.size
    entity.collateral = event.params.collateral
    entity.averagePrice = event.params.averagePrice
    entity.entryFundingRate = event.params.entryFundingRate
    entity.reserveAmount = event.params.reserveAmount
    entity.realisedPnl = event.params.realisedPnl
    // entity.transaction = _createTransactionIfNotExist(event)
    {
      let transId = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
      let trans = Transaction.load(transId)

      if (!trans) {
        trans = new Transaction(transId)
        trans.timestamp = event.block.timestamp.toI32()
        trans.blockNumber = event.block.number.toI32()
        trans.transactionIndex = event.transaction.index.toI32()
        trans.from = event.transaction.from.toHexString()
        if (!event.transaction.to) {
          trans.to = ""
        } else {
          trans.to = event.transaction.to!.toHexString()
        }
        trans.save()
      }
      entity.transaction = transId;
    }

    entity.logIndex = event.logIndex.toI32()
    entity.timestamp = event.block.timestamp.toI32()

    entity.save()

    //set activePosition isActive is false
    const activeEntity = loadOrCreateActivePosition(event.params.key.toHexString());
    activeEntity.isActive = false;
    activeEntity.averagePrice = event.params.averagePrice;
    activeEntity.save();
  }
}

export function handleCollectMarginFees(event: CollectMarginFeesEvent): void {
  // we can't distinguish margin fee from liquidation fee here
  // using subgraph data it will be possible to calculate liquidation fee as:
  // liquidationFee = entity.marginAndLiquidation - entity.margin
  _storeFees('marginAndLiquidation', event.block.timestamp, event.params.feeUsd)
  // From raw
  {
    let entity = new CollectMarginFee(event.transaction.hash.toHexString())

    entity.token = event.params.token
    entity.feeTokens = event.params.feeTokens
    entity.feeUsd = event.params.feeUsd

    // entity.transaction = _createTransactionIfNotExist(event)
    {
      let transId = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
      let trans = Transaction.load(transId)

      if (!trans) {
        trans = new Transaction(transId)
        trans.timestamp = event.block.timestamp.toI32()
        trans.blockNumber = event.block.number.toI32()
        trans.transactionIndex = event.transaction.index.toI32()
        trans.from = event.transaction.from.toHexString()
        if (!event.transaction.to) {
          trans.to = ""
        } else {
          trans.to = event.transaction.to!.toHexString()
        }
        trans.save()
      }
      entity.transaction = transId;
    }

    entity.timestamp = event.block.timestamp.toI32()

    entity.save()
  }
}

export function handleCollectSwapFees(event: CollectSwapFeesEvent): void {
  // from raw
  let entity = new CollectSwapFee(event.transaction.hash.toHexString())

  entity.token = event.params.token
  entity.feeTokens = event.params.feeUsd
  entity.feeUsd = event.params.feeTokens

  // entity.transaction = _createTransactionIfNotExist(event)
  {
    let transId = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
    let trans = Transaction.load(transId)

    if (!trans) {
      trans = new Transaction(transId)
      trans.timestamp = event.block.timestamp.toI32()
      trans.blockNumber = event.block.number.toI32()
      trans.transactionIndex = event.transaction.index.toI32()
      trans.from = event.transaction.from.toHexString()
      if (!event.transaction.to) {
        trans.to = ""
      } else {
        trans.to = event.transaction.to!.toHexString()
      }
      trans.save()
    }
    entity.transaction = transId;
  }
  entity.timestamp = event.block.timestamp.toI32()

  entity.save()
}

// export function handleDecreaseGuaranteedUsd(
//   event: DecreaseGuaranteedUsdEvent
// ): void {
// }

export function handleDecreasePoolAmount(event: DecreasePoolAmountEvent): void {
  let timestamp = event.block.timestamp
  let token = event.params.token
  let totalEntity = loadOrCreateTokenStat(timestamp, 'total', token)
  totalEntity.poolAmount = totalEntity.poolAmount.minus(event.params.amount)
  totalEntity.poolAmountUsd = getTokenAmountUsd(
    token.toHexString(),
    totalEntity.poolAmount
  )
  totalEntity.save()

  _updatePoolAmount(
    timestamp,
    'hourly',
    token,
    totalEntity.poolAmount,
    totalEntity.poolAmountUsd
  )
  _updatePoolAmount(
    timestamp,
    'daily',
    token,
    totalEntity.poolAmount,
    totalEntity.poolAmountUsd
  )
  _updatePoolAmount(
    timestamp,
    'weekly',
    token,
    totalEntity.poolAmount,
    totalEntity.poolAmountUsd
  )
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  // from tradingMapping.ts
  _updateOpenInterest(event.block.timestamp, false, event.params.isLong, event.params.sizeDelta)
  _updateOpenInterestByToken(event.block.timestamp, false, event.params.isLong, event.params.sizeDelta, event.params.indexToken)
  // from mapping.ts
  _storeVolume('margin', event.block.timestamp, event.params.sizeDelta)
  _storeVolumeBySource(
    'margin',
    event.block.timestamp,
    event.transaction.to!,
    event.params.sizeDelta
  )
  _storeVolumeByToken(
    'margin',
    event.block.timestamp,
    event.params.collateralToken,
    event.params.indexToken,
    event.params.sizeDelta
  )
  _storeFees('margin', event.block.timestamp, event.params.fee)
  storeUserAction(event.block.timestamp, event.params.account, 'margin')

  if (event.transaction.from.toHexString() == LIQUIDATOR_ADDRESS) {
    storeLiquidatedPosition(
      event.params.key,
      event.block.timestamp,
      event.params.account,
      event.params.indexToken,
      event.params.sizeDelta,
      event.params.collateralToken,
      event.params.collateralDelta,
      event.params.isLong,
      'partial',
      event.params.price
    )
  }
  let action: string, params: string
  if (event.params.isLong) {
    action = ActionDecreasePositionLong
  } else {
    action = ActionDecreasePositionShort
  }

  //   params = JSON.stringify({
  //     collateralDelta: event.params.collateralDelta,
  //     collateralToken: event.params.collateralToken,
  //     feeBasisPoints: 10,
  //     flags: {},
  //     indexToken: event.params.indexToken,
  //     isLong: event.params.isLong,
  //     key: event.params.key,
  //     price: event.params.price,
  //     sizeDelta: event.params.sizeDelta,
  //   })
  params =
    '{"collateralDelta": "' +
    event.params.collateralDelta.toString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","feeBasisPoints": 10,"flags": {},"indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false') +
    ',"key": "' +
    event.params.key.toHexString() +
    '","price": "' +
    event.params.price.toString() +
    '","sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '"}'
  // _createActionIfNotExist
  {
    const id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)

    if (entity == null) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      if (event.transaction.to) {
        entity.to = event.transaction.to!.toHexString()
      } else {
        entity.to = ''
      }


      entity.action = action
      entity.params = params
      entity.save()
    }
  }

  // from raw
  {
    let id = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
    let entity = new DecreasePosition(id)

    entity.key = event.params.key.toHexString()
    entity.account = event.params.account.toHexString()
    entity.collateralToken = event.params.collateralToken.toHexString()
    entity.indexToken = event.params.indexToken.toHexString()
    entity.collateralDelta = event.params.collateralDelta
    entity.sizeDelta = event.params.sizeDelta
    entity.isLong = event.params.isLong
    entity.price = event.params.price
    entity.fee = event.params.fee

    // entity.transaction = _createTransactionIfNotExist(event)
    {
      let transId = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
      let trans = Transaction.load(transId)

      if (!trans) {
        trans = new Transaction(transId)
        trans.timestamp = event.block.timestamp.toI32()
        trans.blockNumber = event.block.number.toI32()
        trans.transactionIndex = event.transaction.index.toI32()
        trans.from = event.transaction.from.toHexString()
        if (!event.transaction.to) {
          trans.to = ""
        } else {
          trans.to = event.transaction.to!.toHexString()
        }
        trans.save()
      }
      entity.transaction = transId;
    }
    entity.logIndex = event.logIndex.toI32()
    entity.timestamp = event.block.timestamp.toI32()

    entity.save()
  }
}

export function handleDecreaseReservedAmount(
  event: DecreaseReservedAmountEvent
): void {
  let timestamp = event.block.timestamp
  let token = event.params.token
  let totalEntity = loadOrCreateTokenStat(timestamp, 'total', token)

  totalEntity.reservedAmount = totalEntity.reservedAmount.minus(event.params.amount)
  totalEntity.reservedAmountUsd = getTokenAmountUsd(
    token.toHexString(),
    totalEntity.reservedAmount
  )
  totalEntity.save()

  _updateReservedAmount(
    timestamp,
    'hourly',
    token,
    totalEntity.reservedAmount,
    totalEntity.reservedAmountUsd
  )
  _updateReservedAmount(
    timestamp,
    'daily',
    token,
    totalEntity.reservedAmount,
    totalEntity.reservedAmountUsd
  )
  _updateReservedAmount(
    timestamp,
    'weekly',
    token,
    totalEntity.reservedAmount,
    totalEntity.reservedAmountUsd
  )
}

export function handleDecreaseUsdgAmount(event: DecreaseUsdgAmountEvent): void {
  let timestamp = event.block.timestamp
  let token = event.params.token
  let totalEntity = loadOrCreateTokenStat(timestamp, 'total', token)

  totalEntity.usdgAmount = totalEntity.usdgAmount.minus(event.params.amount)
  totalEntity.save()

  _updateUsdgAmount(timestamp, 'hourly', token, totalEntity.usdgAmount)
  _updateUsdgAmount(timestamp, 'daily', token, totalEntity.usdgAmount)
  _updateUsdgAmount(timestamp, 'weekly', token, totalEntity.usdgAmount)
}

// export function handleDirectPoolDeposit(event: DirectPoolDepositEvent): void {
// }

// export function handleIncreaseGuaranteedUsd(
//   event: IncreaseGuaranteedUsdEvent
// ): void {
// }

export function handleIncreasePoolAmount(event: IncreasePoolAmountEvent): void {
  let timestamp = event.block.timestamp
  let token = event.params.token
  let totalEntity = loadOrCreateTokenStat(timestamp, 'total', token)
  totalEntity.poolAmount = totalEntity.poolAmount.plus(event.params.amount)
  totalEntity.poolAmountUsd = getTokenAmountUsd(
    token.toHexString(),
    totalEntity.poolAmount
  )
  totalEntity.save()

  _updatePoolAmount(
    timestamp,
    'hourly',
    token,
    totalEntity.poolAmount,
    totalEntity.poolAmountUsd
  )
  _updatePoolAmount(
    timestamp,
    'daily',
    token,
    totalEntity.poolAmount,
    totalEntity.poolAmountUsd
  )
  _updatePoolAmount(
    timestamp,
    'weekly',
    token,
    totalEntity.poolAmount,
    totalEntity.poolAmountUsd
  )
}

export function handleIncreasePosition(event: IncreasePositionEvent): void {
  // from tradingMapping
  _updateOpenInterest(event.block.timestamp, true, event.params.isLong, event.params.sizeDelta)
  _updateOpenInterestByToken(event.block.timestamp, true, event.params.isLong, event.params.sizeDelta, event.params.indexToken)
  // from mapping
  _storeVolume('margin', event.block.timestamp, event.params.sizeDelta)
  _storeVolumeBySource(
    'margin',
    event.block.timestamp,
    event.transaction.to!,
    event.params.sizeDelta
  )
  _storeVolumeByToken(
    'margin',
    event.block.timestamp,
    event.params.collateralToken,
    event.params.indexToken,
    event.params.sizeDelta
  )
  _storeFees('margin', event.block.timestamp, event.params.fee)
  storeUserAction(event.block.timestamp, event.params.account, 'margin')

  let action: string, params: string
  if (event.params.isLong) {
    action = ActionIncreasePositionLong
  } else {
    action = ActionIncreasePositionShort
  }

  //   params = JSON.stringify({
  //     collateralDelta: event.params.collateralDelta,
  //     collateralToken: event.params.collateralToken,
  //     feeBasisPoints: 10,
  //     flags: {},
  //     indexToken: event.params.indexToken,
  //     isLong: event.params.isLong,
  //     key: event.params.key,
  //     price: event.params.price,
  //     sizeDelta: event.params.sizeDelta,
  //   })
  params =
    '{"collateralDelta": "' +
    event.params.collateralDelta.toString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","feeBasisPoints": 10,"flags": {},"indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false') +
    ',"key": "' +
    event.params.key.toHexString() +
    '","price": "' +
    event.params.price.toString() +
    '","sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '"}'
  // _createActionIfNotExist
  {
    const id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)

    if (entity == null) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      if (event.transaction.to) {
        entity.to = event.transaction.to!.toHexString()
      } else {
        entity.to = ''
      }

      entity.action = action
      entity.params = params
      entity.save()
    }
  }
  // from raw
  {
    let id = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
    let entity = new IncreasePosition(id)

    entity.key = event.params.key.toHexString()
    entity.account = event.params.account.toHexString()
    entity.collateralToken = event.params.collateralToken.toHexString()
    entity.indexToken = event.params.indexToken.toHexString()
    entity.collateralDelta = event.params.collateralDelta
    entity.sizeDelta = event.params.sizeDelta
    entity.isLong = event.params.isLong
    entity.price = event.params.price
    entity.fee = event.params.fee

    // entity.transaction = _createTransactionIfNotExist(event)
    {
      let transId = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
      let trans = Transaction.load(transId)

      if (!trans) {
        trans = new Transaction(transId)
        trans.timestamp = event.block.timestamp.toI32()
        trans.blockNumber = event.block.number.toI32()
        trans.transactionIndex = event.transaction.index.toI32()
        trans.from = event.transaction.from.toHexString()
        if (!event.transaction.to) {
          trans.to = ""
        } else {
          trans.to = event.transaction.to!.toHexString()
        }
        trans.save()
      }
      entity.transaction = transId;
    }
    entity.logIndex = event.logIndex.toI32()
    entity.timestamp = event.block.timestamp.toI32()

    entity.save()

    //save info to activePosition
    let activeId = event.params.key.toHexString();
    const activeEntity = loadOrCreateActivePosition(activeId);
    activeEntity.account = event.params.account.toHexString();
    activeEntity.isLong = event.params.isLong;
    activeEntity.collateralToken = event.params.collateralToken.toHexString();
    activeEntity.indexToken = event.params.indexToken.toHexString();
    activeEntity.averagePrice = event.params.price;
    activeEntity.timestamp = event.block.timestamp.toI32();
    activeEntity.isActive = true;
    activeEntity.save();
  }
}

export function handleIncreaseReservedAmount(
  event: IncreaseReservedAmountEvent
): void {
  let timestamp = event.block.timestamp
  let token = event.params.token
  let totalEntity = loadOrCreateTokenStat(timestamp, 'total', token)

  totalEntity.reservedAmount = totalEntity.reservedAmount.plus(event.params.amount)
  totalEntity.reservedAmountUsd = getTokenAmountUsd(
    token.toHexString(),
    totalEntity.reservedAmount
  )
  totalEntity.save()

  _updateReservedAmount(
    timestamp,
    'hourly',
    token,
    totalEntity.reservedAmount,
    totalEntity.reservedAmountUsd
  )
  _updateReservedAmount(
    timestamp,
    'daily',
    token,
    totalEntity.reservedAmount,
    totalEntity.reservedAmountUsd
  )
  _updateReservedAmount(
    timestamp,
    'weekly',
    token,
    totalEntity.reservedAmount,
    totalEntity.reservedAmountUsd
  )
}

export function handleIncreaseUsdgAmount(event: IncreaseUsdgAmountEvent): void {
  let timestamp = event.block.timestamp
  let token = event.params.token
  let totalEntity = loadOrCreateTokenStat(timestamp, 'total', token)

  totalEntity.usdgAmount = totalEntity.usdgAmount.plus(event.params.amount)
  totalEntity.save()

  _updateUsdgAmount(timestamp, 'hourly', token, totalEntity.usdgAmount)
  _updateUsdgAmount(timestamp, 'daily', token, totalEntity.usdgAmount)
  _updateUsdgAmount(timestamp, 'weekly', token, totalEntity.usdgAmount)
}

export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
  // from tradingMapping
  _updateOpenInterest(event.block.timestamp, false, event.params.isLong, event.params.size)
  _updateOpenInterestByToken(event.block.timestamp, false, event.params.isLong, event.params.size, event.params.indexToken)
  _storePnl(event.block.timestamp, event.params.collateral.neg(), true)
  // from mapping
  _storeVolume('liquidation', event.block.timestamp, event.params.size)
  _storeVolumeBySource(
    'liquidation',
    event.block.timestamp,
    event.transaction.to!,
    event.params.size
  )

  // liquidated collateral is not a fee. it's just traders pnl
  // also size * rate incorrect as well because it doesn't consider borrow fee
  let fee = event.params.collateral
  _storeFees('liquidation', event.block.timestamp, fee)

  storeLiquidatedPosition(
    event.params.key,
    event.block.timestamp,
    event.params.account,
    event.params.indexToken,
    event.params.size,
    event.params.collateralToken,
    event.params.collateral,
    event.params.isLong,
    'full',
    event.params.markPrice
  )

  let action: string, params: string
  if (event.params.isLong) {
    action = ActionLiquidatePositionLong
  } else {
    action = ActionLiquidatePositionShort
  }

  // params = JSON.stringify({
  //   collateral: event.params.collateral,
  //   collateralToken: event.params.collateralToken,
  //   feeBasisPoints: 10,
  //   indexToken: event.params.indexToken,
  //   isLong: event.params.isLong,
  //   key: event.params.key,
  //   markPrice: event.params.markPrice,
  //   reserveAmount: event.params.reserveAmount,
  //   size: event.params.size,
  // })

  params =
    '{"collateral": "' +
    event.params.collateral.toString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","feeBasisPoints": 10,"indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false') +
    ',"key": "' +
    event.params.key.toHexString() +
    '","markPrice": "' +
    event.params.markPrice.toString() +
    '","reserveAmount": "' +
    event.params.reserveAmount.toString() +
    '","size": "' +
    event.params.size.toString() +
    '"}'
  // _createActionIfNotExist
  {
    const id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)

    if (entity == null) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      if (event.transaction.to) {
        entity.to = event.transaction.to!.toHexString()
      } else {
        entity.to = ''
      }

      entity.action = action
      entity.params = params
      entity.save()
    }
  }
  // from raw
  {
    let id = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
    let entity = new LiquidatePosition(id)

    entity.key = event.params.key.toHexString()
    entity.account = event.params.account.toHexString()
    entity.collateralToken = event.params.collateralToken.toHexString()
    entity.indexToken = event.params.indexToken.toHexString()
    entity.isLong = event.params.isLong
    entity.size = event.params.size
    entity.collateral = event.params.collateral
    entity.reserveAmount = event.params.reserveAmount
    entity.realisedPnl = event.params.realisedPnl
    entity.markPrice = event.params.markPrice

    // entity.transaction = _createTransactionIfNotExist(event)
    {
      let transId = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
      let trans = Transaction.load(transId)

      if (!trans) {
        trans = new Transaction(transId)
        trans.timestamp = event.block.timestamp.toI32()
        trans.blockNumber = event.block.number.toI32()
        trans.transactionIndex = event.transaction.index.toI32()
        trans.from = event.transaction.from.toHexString()
        if (!event.transaction.to) {
          trans.to = ""
        } else {
          trans.to = event.transaction.to!.toHexString()
        }
        trans.save()
      }
      entity.transaction = transId;
    }
    entity.logIndex = event.logIndex.toI32()
    entity.timestamp = event.block.timestamp.toI32()

    entity.save()

    //set activePosition isActive is false
    let activeEntity = ActivePosition.load(event.params.key.toHexString());
    if (activeEntity != null) {
      activeEntity.isActive = false;
      activeEntity.save();
    }
  }
}

export function handleSellUSDG(event: SellUSDGEvent): void {
  let volume = event.params.usdgAmount.times(BigInt.fromString('1000000000000'))
  _storeVolumeBySource(
    'burn',
    event.block.timestamp,
    event.transaction.to!,
    volume
  )
  _storeVolume('burn', event.block.timestamp, volume)

  let fee = (volume.times(event.params.feeBasisPoints)).div(BASIS_POINTS_DIVISOR)
  _storeFees('burn', event.block.timestamp, fee)
  storeUserAction(event.block.timestamp, event.params.account, 'mintBurn')

  let action: string, params: string
  action = ActionSellUSDG
  params =
    '{"token":"' +
    event.params.token.toHexString() +
    '","usdgAmount":"' +
    event.params.usdgAmount.toString() +
    '","tokenAmount":"' +
    event.params.tokenAmount.toString() +
    '"}'

  // _createActionIfNotExist
  {
    const id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)

    if (entity == null) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      if (event.transaction.to) {
        entity.to = event.transaction.to!.toHexString()
      } else {
        entity.to = ''
      }

      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleSwap(event: SwapEvent): void {
  let txId = event.transaction.hash.toHexString()
  let transaction = Transaction.load(txId)
  if (transaction == null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
    transaction.timestamp = event.block.timestamp.toI32()
    transaction.blockNumber = event.block.number.toI32()
    transaction.transactionIndex = event.transaction.index.toI32()
    transaction.from = event.transaction.from.toHexString()
    if (!event.transaction.to) {
      transaction.to = ""
    } else {
      transaction.to = event.transaction.to!.toHexString()
    }
    transaction.save()
  }

  let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString()
  let entity = new Swap(id)

  entity.tokenIn = event.params.tokenIn.toHexString()
  entity.tokenOut = event.params.tokenOut.toHexString()
  entity.account = event.params.account.toHexString()

  entity.amountIn = event.params.amountIn
  entity.amountOut = event.params.amountOut
  entity.amountOutAfterFees = event.params.amountOutAfterFees
  entity.feeBasisPoints = event.params.feeBasisPoints

  entity.transaction = txId

  entity.tokenInPrice = getTokenPrice(Address.fromString(entity.tokenIn))

  entity.timestamp = event.block.timestamp.toI32()

  entity.save()

  const token = _loadOrStoreToken(Address.fromString(entity.tokenIn), VaultContract.bind(dataSource.address()));
  let decimals = token.decimals;
  let denominator = BigInt.fromString('10').pow(decimals as u8)
  let volume = (entity.amountIn.times(entity.tokenInPrice)).div(denominator)
  _storeVolume('swap', event.block.timestamp, volume)
  _storeVolumeBySource(
    'swap',
    event.block.timestamp,
    event.transaction.to!,
    volume
  )
  _storeVolumeByToken(
    'swap',
    event.block.timestamp,
    event.params.tokenIn,
    event.params.tokenOut,
    volume
  )

  let fee = (volume.times(entity.feeBasisPoints)).div(BASIS_POINTS_DIVISOR)
  _storeFees('swap', event.block.timestamp, fee)

  storeUserAction(event.block.timestamp, event.transaction.from, 'swap')

  let action: string, params: string
  action = ActionSwap
  let usdAmount = event.params.amountIn.times(entity.tokenInPrice)
  // params = JSON.stringify({
  //   amountIn: event.params.amountIn,
  //   amountOut: event.params.amountOut,
  //   feeBasisPoints: event.params.feeBasisPoints,
  //   tokenIn: event.params.tokenIn,
  //   tokenOut: event.params.tokenOut,
  //   usdAmount: usdAmount,
  // })
  params =
    '{"amountIn": "' +
    event.params.amountIn.toString() +
    '","amountOut": "' +
    event.params.amountOut.toString() +
    '","feeBasisPoints": "' +
    event.params.feeBasisPoints.toString() +
    '","tokenIn": "' +
    event.params.tokenIn.toHexString() +
    '","tokenOut": "' +
    event.params.tokenOut.toHexString() +
    '","usdAmount": "' +
    usdAmount.toString() +
    '"}'
  // _createActionIfNotExist
  {
    const id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)

    if (entity == null) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      if (event.transaction.to) {
        entity.to = event.transaction.to!.toHexString()
      } else {
        entity.to = ''
      }

      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleUpdateFundingRate(event: UpdateFundingRateEvent): void {
  const FUNDING_INTERVAL = 3600
  let fundingIntervalTimestamp =
    (event.block.timestamp.toI32() / FUNDING_INTERVAL) * FUNDING_INTERVAL

  let timestamp = getDayId(event.block.timestamp)
  let id = _getFundingRateId(timestamp, event.params.token)
  let entity = FundingRate.load(id)

  let totalId = _getFundingRateId('total', event.params.token)
  let totalEntity = FundingRate.load(totalId)

  if (entity == null) {
    entity = new FundingRate(id)
    if (totalEntity) {
      entity.startFundingRate = totalEntity.endFundingRate
      entity.startTimestamp = totalEntity.endTimestamp
    } else {
      entity.startFundingRate = 0
      entity.startTimestamp = fundingIntervalTimestamp
    }
    entity.timestamp = BigInt.fromString(timestamp).toI32()
    entity.token = event.params.token.toHexString()
    entity.period = 'daily'
  }
  entity.endFundingRate = event.params.fundingRate.toI32()
  entity.endTimestamp = fundingIntervalTimestamp
  entity.save()

  if (totalEntity == null) {
    totalEntity = new FundingRate(totalId)
    totalEntity.period = 'total'
    totalEntity.startFundingRate = 0
    totalEntity.token = event.params.token.toHexString()
    totalEntity.startTimestamp = fundingIntervalTimestamp
  }
  totalEntity.endFundingRate = event.params.fundingRate.toI32()
  totalEntity.timestamp = BigInt.fromString(timestamp).toI32()
  totalEntity.endTimestamp = fundingIntervalTimestamp
  totalEntity.save()
}

// export function handleUpdatePnl(event: UpdatePnlEvent): void {

// }

export function handleUpdatePosition(event: UpdatePositionEvent): void {
  const entity = loadOrCreateActivePosition(event.params.key.toHexString())
  entity.averagePrice = event.params.averagePrice
  entity.entryFundingRate = event.params.entryFundingRate
  entity.collateral = event.params.collateral
  entity.size = event.params.size
  entity.save()
  // from raw
  {
    let id = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
    let entity = new UpdatePosition(id)

    entity.key = event.params.key.toHexString()
    entity.size = event.params.size
    entity.collateral = event.params.collateral
    entity.averagePrice = event.params.averagePrice
    entity.entryFundingRate = event.params.entryFundingRate
    entity.reserveAmount = event.params.reserveAmount
    entity.realisedPnl = event.params.realisedPnl

    // entity.transaction = _createTransactionIfNotExist(event)
    {
      let transId = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
      let trans = Transaction.load(transId)

      if (!trans) {
        trans = new Transaction(transId)
        trans.timestamp = event.block.timestamp.toI32()
        trans.blockNumber = event.block.number.toI32()
        trans.transactionIndex = event.transaction.index.toI32()
        trans.from = event.transaction.from.toHexString()
        if (!event.transaction.to) {
          trans.to = ""
        } else {
          trans.to = event.transaction.to!.toHexString()
        }
        trans.save()
      }
      entity.transaction = transId;
    }
    entity.logIndex = event.logIndex.toI32()
    entity.timestamp = event.block.timestamp.toI32()

    entity.save()
  }
}


function _storePnl(timestamp: BigInt, pnl: BigInt, isLiquidated: boolean): void {
  let dayTimestamp = timestampToDay(timestamp)

  let totalId = "total"
  let totalEntity = loadOrCreateTradingStat(totalId, "total", dayTimestamp)
  if (pnl > BI_ZERO) {
    totalEntity.profit = totalEntity.profit.plus(pnl)
    totalEntity.profitCumulative = totalEntity.profitCumulative.plus(pnl)
  } else {
    totalEntity.loss = totalEntity.loss.minus(pnl)
    totalEntity.lossCumulative = totalEntity.lossCumulative.minus(pnl)
    if (isLiquidated) {
      totalEntity.liquidatedCollateral = totalEntity.liquidatedCollateral.minus(pnl)
      totalEntity.liquidatedCollateralCumulative = totalEntity.liquidatedCollateralCumulative.minus(pnl)
    }
  }
  totalEntity.timestamp = dayTimestamp.toI32()
  totalEntity.save()

  let id = dayTimestamp.toString()
  let entity = loadOrCreateTradingStat(id, "daily", dayTimestamp)

  if (pnl > BI_ZERO) {
    entity.profit = entity.profit.plus(pnl)
  } else {
    entity.loss = entity.loss.minus(pnl)
    if (isLiquidated) {
      entity.liquidatedCollateral = entity.liquidatedCollateral.minus(pnl)
    }
  }
  entity.profitCumulative = totalEntity.profitCumulative
  entity.lossCumulative = totalEntity.lossCumulative
  entity.liquidatedCollateralCumulative = totalEntity.liquidatedCollateralCumulative
  entity.save()
}

function _updatePoolAmount(
  timestamp: BigInt,
  period: string,
  token: Address,
  poolAmount: BigInt,
  poolAmountUsd: BigInt
): void {
  let entity = loadOrCreateTokenStat(timestamp, period, token)
  entity.poolAmount = poolAmount
  entity.poolAmountUsd = poolAmountUsd
  entity.save()
}

function _updateOpenInterest(timestamp: BigInt, increase: boolean, isLong: boolean, delta: BigInt): void {
  let dayTimestamp = timestampToDay(timestamp)
  let totalId = "total"
  let totalEntity = loadOrCreateTradingStat(totalId, "total", dayTimestamp)

  if (isLong) {
    totalEntity.longOpenInterest = increase ? totalEntity.longOpenInterest.plus(delta) : totalEntity.longOpenInterest.minus(delta)
  } else {
    totalEntity.shortOpenInterest = increase ? totalEntity.shortOpenInterest.plus(delta) : totalEntity.shortOpenInterest.minus(delta)
  }
  totalEntity.save()

  let id = dayTimestamp.toString()
  let entity = loadOrCreateTradingStat(id, "daily", dayTimestamp)

  entity.longOpenInterest = totalEntity.longOpenInterest
  entity.shortOpenInterest = totalEntity.shortOpenInterest
  entity.save()
}

function _updateOpenInterestByToken(timestamp: BigInt, increase: boolean, isLong: boolean, delta: BigInt, indexToken: Address): void {
  let id = indexToken.toHexString();
  let entity = loadOrCreateOpenInterestByToken(id, "total", timestamp, indexToken)

  if (isLong) {
    entity.long = increase ? entity.long.plus(delta) : entity.long.minus(delta)
  } else {
    entity.short = increase ? entity.short.plus(delta) : entity.short.minus(delta)
  }
  entity.save()

  // update day open interest
  let dayTimestamp = timestampToDay(timestamp)
  let dayId = indexToken.toHexString() + ":" + dayTimestamp.toHexString()
  let dayEntity = loadOrCreateOpenInterestByToken(dayId, "daily", dayTimestamp, indexToken)

  dayEntity.long = entity.long
  dayEntity.short = entity.short
  dayEntity.save()
}

function _storeVolume(type: string, timestamp: BigInt, volume: BigInt): void {
  let deprecatedId = getHourId(timestamp)
  let deprecatedEntity = HourlyVolume.load(deprecatedId)

  if (deprecatedEntity == null) {
    deprecatedEntity = new HourlyVolume(deprecatedId)
    for (let i = 0; i < TRADE_TYPES.length; i++) {
      let _type = TRADE_TYPES[i]
      deprecatedEntity.setBigInt(_type, BI_ZERO)
    }
  }

  deprecatedEntity.setBigInt(type, deprecatedEntity.getBigInt(type).plus(volume))
  deprecatedEntity.save()

  let hourId = getHourId(timestamp) + ':hourly'
  let hourEntity = loadOrCreateVolumeStat(hourId, 'hourly')
  hourEntity.setBigInt(type, hourEntity.getBigInt(type).plus(volume))
  hourEntity.save()

  let dayId = getDayId(timestamp)
  let dayEntity = loadOrCreateVolumeStat(dayId, 'daily')
  dayEntity.setBigInt(type, dayEntity.getBigInt(type).plus(volume))
  dayEntity.save()

  let totalEntity = loadOrCreateVolumeStat('total', 'total')
  totalEntity.setBigInt(type, totalEntity.getBigInt(type).plus(volume))
  totalEntity.save()
}

function _storeVolumeBySource(
  type: string,
  timestamp: BigInt,
  source: Address,
  volume: BigInt
): void {
  let id = getHourId(timestamp) + ':' + source.toHexString()
  let entity = HourlyVolumeBySource.load(id)

  if (entity == null) {
    entity = new HourlyVolumeBySource(id)
    entity.source = source.toHexString()
    entity.timestamp = (timestamp.toI32() / 3600) * 3600
    for (let i = 0; i < TRADE_TYPES.length; i++) {
      let _type = TRADE_TYPES[i]
      entity.setBigInt(_type, BI_ZERO)
    }
  }

  entity.setBigInt(type, entity.getBigInt(type).plus(volume))
  entity.save()
}

function _storeVolumeByToken(
  type: string,
  timestamp: BigInt,
  tokenA: Address,
  tokenB: Address,
  volume: BigInt
): void {
  let id =
    getHourId(timestamp) +
    ':' +
    tokenA.toHexString() +
    ':' +
    tokenB.toHexString()
  let entity = HourlyVolumeByToken.load(id)

  if (entity == null) {
    entity = new HourlyVolumeByToken(id)
    entity.tokenA = tokenA
    entity.tokenB = tokenB
    entity.timestamp = (timestamp.toI32() / 3600) * 3600
    for (let i = 0; i < TRADE_TYPES.length; i++) {
      let _type = TRADE_TYPES[i]
      entity.setBigInt(_type, BI_ZERO)
    }
  }

  entity.setBigInt(type, entity.getBigInt(type).plus(volume))
  entity.save()
}

function _storeFees(type: string, timestamp: BigInt, fees: BigInt): void {
  let deprecatedId = getHourId(timestamp)
  let entityDeprecated = HourlyFee.load(deprecatedId)

  if (entityDeprecated == null) {
    entityDeprecated = new HourlyFee(deprecatedId)
    for (let i = 0; i < TRADE_TYPES.length; i++) {
      let _type = TRADE_TYPES[i]
      entityDeprecated.setBigInt(_type, BI_ZERO)
    }
  }

  entityDeprecated.setBigInt(type, entityDeprecated.getBigInt(type).plus(fees))
  entityDeprecated.save()

  //

  let id = getDayId(timestamp)
  let entity = loadOrCreateFeeStat(id, 'daily')
  entity.setBigInt(type, entity.getBigInt(type).plus(fees))
  entity.save()

  let totalEntity = loadOrCreateFeeStat('total', 'total')
  totalEntity.setBigInt(type, totalEntity.getBigInt(type).plus(fees))
  totalEntity.save()
}

function _updateReservedAmount(
  timestamp: BigInt,
  period: string,
  token: Address,
  reservedAmount: BigInt,
  reservedAmountUsd: BigInt
): void {
  let entity = loadOrCreateTokenStat(timestamp, period, token)
  entity.reservedAmount = reservedAmount
  entity.reservedAmountUsd = reservedAmountUsd
  entity.save()
}

function _updateUsdgAmount(
  timestamp: BigInt,
  period: string,
  token: Address,
  usdgAmount: BigInt
): void {
  let entity = loadOrCreateTokenStat(timestamp, period, token)
  entity.usdgAmount = usdgAmount
  entity.save()
}


function _getFundingRateId(timeKey: string, token: Address): string {
  return timeKey + ':' + token.toHexString()
}


export function getTokenAmountUsd(tokenAddr: string, amount: BigInt): BigInt {
  const price = getMinPriveV1(Address.fromString(tokenAddr));
  return amount.times(price);
}

function getTokenPrice(tokenAddr: Address): BigInt {
  const vault = VaultContract.bind(dataSource.address());
  const minResult = vault.try_getMinPrice(tokenAddr);
  if (minResult.reverted) {
    return BI_ZERO;
  }
  return minResult.value
}

function getMinPriveV1(tokenAddr: Address): BigInt {
  const vault = VaultContract.bind(dataSource.address());
  const token = _loadOrStoreToken(tokenAddr, vault);
  const minResult = vault.try_getMinPrice(tokenAddr);
  if (minResult.reverted) {
    return BI_ZERO;
  }
  return minResult.value.div(BigInt.fromI32(10).pow(token.vaultDecimals as u8));
}

function _loadOrStoreToken(tokenAddr: Address, vault: VaultContract): Token {
  const id = tokenAddr.toHexString();
  let token = Token.load(id);
  if (!token) {
    const tokenContract = ERC20Contract.bind(tokenAddr);
    let symbol = 'unkown';
    const symbolResult = tokenContract.try_symbol();
    if (!symbolResult.reverted) {
      symbol = symbolResult.value;
    }
    let name = 'unkown';
    const nameResult = tokenContract.try_name();
    if (!nameResult.reverted) {
      name = nameResult.value;
    }
    let decimals = 18;
    const decimalsResult = tokenContract.try_decimals();
    if (!decimalsResult.reverted) {
      decimals = decimalsResult.value;
    }
    let vaultDecimals = 18;
    const vaultDecimalsResult = vault.try_tokenDecimals(tokenAddr);
    if (!vaultDecimalsResult.reverted) {
      vaultDecimals = vaultDecimalsResult.value.toI32();
    }

    token = new Token(id)
    token.symbol = symbol;
    token.name = name;
    token.decimals = decimals;
    token.vaultDecimals = vaultDecimals;
    token.save();
  }
  return token;
}
