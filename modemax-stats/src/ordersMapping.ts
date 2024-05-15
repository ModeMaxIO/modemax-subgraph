import {
  BigInt,
  Address,
  // TypedMap,
  // ethereum,
  // store,
  // log
} from '@graphprotocol/graph-ts'
import {
  CreateIncreaseOrder,
  CreateDecreaseOrder,
  CreateSwapOrder,
  CancelIncreaseOrder,
  CancelDecreaseOrder,
  CancelSwapOrder,
  ExecuteIncreaseOrder,
  ExecuteDecreaseOrder,
  ExecuteSwapOrder,
  UpdateIncreaseOrder,
  UpdateDecreaseOrder,
  UpdateSwapOrder,
} from '../generated/OrderBook/OrderBook'

import { Order, OrderStat } from '../generated/schema'

import { getTokenAmountUsd } from './helpers'

import {
  _createActionIfNotExist,
  ActionExecuteIncreaseOrder,
  ActionCreateIncreaseOrder,
  ActionCancelIncreaseOrder,
  ActionUpdateIncreaseOrder,
  ActionCreateDecreaseOrder,
  ActionCancelDecreaseOrder,
  ActionUpdateDecreaseOrder,
  ActionExecuteSwapOrder,
  ActionCreateSwapOrder,
  ActionUpdateSwapOrder,
  ActionCancelSwapOrder,
} from './actionsMapping'

function _getId(account: Address, type: string, index: BigInt): string {
  let id = account.toHexString() + '-' + type + '-' + index.toString()
  return id
}

function _storeStats(
  incrementProp: string,
  decrementProp: string | null
): void {
  let entity = OrderStat.load('total')
  if (entity == null) {
    entity = new OrderStat('total')
    entity.openSwap = 0 as i32
    entity.openIncrease = 0 as i32
    entity.openDecrease = 0 as i32
    entity.cancelledSwap = 0 as i32
    entity.cancelledIncrease = 0 as i32
    entity.cancelledDecrease = 0 as i32
    entity.executedSwap = 0 as i32
    entity.executedIncrease = 0 as i32
    entity.executedDecrease = 0 as i32
    entity.period = 'total'
  }

  entity.setI32(incrementProp, entity.getI32(incrementProp) + 1)
  if (decrementProp != null) {
    entity.setI32(decrementProp, entity.getI32(decrementProp) - 1)
  }

  entity.save()
}

function _handleCreateOrder(
  account: Address,
  type: string,
  index: BigInt,
  size: BigInt,
  timestamp: BigInt
): void {
  let id = _getId(account, type, index)
  let order = new Order(id)

  order.account = account.toHexString()
  order.createdTimestamp = timestamp.toI32()
  order.index = index
  order.type = type
  order.status = 'open'
  order.size = size

  order.save()
}

function _handleCancelOrder(
  account: Address,
  type: string,
  index: BigInt,
  timestamp: BigInt
): void {
  let id = account.toHexString() + '-' + type + '-' + index.toString()
  let order = Order.load(id)

  order.status = 'cancelled'
  order.cancelledTimestamp = timestamp.toI32()

  order.save()
}

function _handleExecuteOrder(
  account: Address,
  type: string,
  index: BigInt,
  timestamp: BigInt
): void {
  let id = account.toHexString() + '-' + type + '-' + index.toString()
  let order = Order.load(id)

  order.status = 'executed'
  order.executedTimestamp = timestamp.toI32()

  order.save()
}

export function handleCreateIncreaseOrder(event: CreateIncreaseOrder): void {
  _handleCreateOrder(
    event.params.account,
    'increase',
    event.params.orderIndex,
    event.params.sizeDelta,
    event.block.timestamp
  )
  _storeStats('openIncrease', null)

  let action: string, params: string
  action = ActionCreateIncreaseOrder

  // params = JSON.stringify({
  //   account: event.params.account,
  //   collateralToken: event.params.collateralToken,
  //   createdAtBlock: event.block.number,
  //   executionFee: event.params.executionFee,
  //   indexToken: event.params.indexToken,
  //   isLong: event.params.isLong,
  //   orderIndex: event.params.orderIndex,
  //   purchaseToken: event.params.purchaseToken,
  //   purchaseTokenAmount: event.params.purchaseTokenAmount,
  //   sizeDelta: event.params.sizeDelta,
  //   triggerAboveThreshold: event.params.triggerAboveThreshold,
  //   triggerPrice: event.params.triggerPrice,
  //   type: 'Increase',
  //   updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  // })
  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","createdAtBlock": ' +
    event.block.number.toString() +
    ',"executionFee": "' +
    event.params.executionFee.toString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false') +
    ',"orderIndex": "' +
    event.params.orderIndex.toString()

  params +=
    '","purchaseToken": "' +
    event.params.purchaseToken.toHexString() +
    '","purchaseTokenAmount": "' +
    event.params.purchaseTokenAmount.toString() +
    '","sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerPrice": "' +
    event.params.triggerPrice.toString() +
    '","type": "Increase","updatedAt": ' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleCancelIncreaseOrder(event: CancelIncreaseOrder): void {
  _handleCancelOrder(
    event.params.account,
    'increase',
    event.params.orderIndex,
    event.block.timestamp
  )
  _storeStats('cancelledIncrease', 'openIncrease')

  let action: string, params: string
  action = ActionCancelIncreaseOrder

  // params = JSON.stringify({
  //   account: event.params.account,
  //   collateralToken: event.params.collateralToken,
  //   executionFee: event.params.executionFee,
  //   indexToken: event.params.indexToken,
  //   isLong: event.params.isLong,
  //   orderIndex: event.params.orderIndex,
  //   purchaseToken: event.params.purchaseToken,
  //   purchaseTokenAmount: event.params.purchaseTokenAmount,
  //   sizeDelta: event.params.sizeDelta,
  //   triggerAboveThreshold: event.params.triggerAboveThreshold,
  //   triggerPrice: event.params.triggerPrice,
  //   type: 'Increase',
  //   updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  // })

  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","executionFee": "' +
    event.params.executionFee.toString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false') +
    ',"orderIndex": "' +
    event.params.orderIndex.toString()

  params +=
    '","purchaseToken": "' +
    event.params.purchaseToken.toHexString() +
    '","purchaseTokenAmount": "' +
    event.params.purchaseTokenAmount.toString() +
    '","sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerPrice": "' +
    event.params.triggerPrice.toString() +
    '","type": "Increase","updatedAt": ' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleExecuteIncreaseOrder(event: ExecuteIncreaseOrder): void {
  _handleExecuteOrder(
    event.params.account,
    'increase',
    event.params.orderIndex,
    event.block.timestamp
  )
  _storeStats('executedIncrease', 'openIncrease')

  let action: string, params: string
  action = ActionExecuteIncreaseOrder

  //   params = JSON.stringify({
  //     account: event.params.account,
  //     collateralToken: event.params.collateralToken,
  //     executionFee: event.params.executionFee,
  //     executionPrice: event.params.executionPrice,
  //     indexToken: event.params.indexToken,
  //     isLong: event.params.isLong,
  //     orderIndex: event.params.orderIndex,
  //     purchaseToken: event.params.purchaseToken,
  //     purchaseTokenAmount: event.params.purchaseTokenAmount,
  //     sizeDelta: event.params.sizeDelta,
  //     triggerAboveThreshold: event.params.triggerAboveThreshold,
  //     triggerPrice: event.params.triggerPrice,
  //     type: 'Increase',
  //     updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  //   })

  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","createdAtBlock": ' +
    event.block.number.toString() +
    ',"executionFee": "' +
    event.params.executionFee.toString() +
    '","executionPrice": "' +
    event.params.executionPrice.toString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false')

  params +=
    ',"orderIndex": "' +
    event.params.orderIndex.toString() +
    '","purchaseToken": "' +
    event.params.purchaseToken.toHexString() +
    '","purchaseTokenAmount": "' +
    event.params.purchaseTokenAmount.toString() +
    '","sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerPrice": "' +
    event.params.triggerPrice.toString() +
    '","type": "Increase","updatedAt": ' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleUpdateIncreaseOrder(event: UpdateIncreaseOrder): void {
  let action: string, params: string
  action = ActionUpdateIncreaseOrder
  //   params = JSON.stringify({
  //     account: event.params.account,
  //     collateralToken: event.params.collateralToken,
  //     indexToken: event.params.indexToken,
  //     isLong: event.params.isLong,
  //     orderIndex: event.params.orderIndex,
  //     sizeDelta: event.params.sizeDelta,
  //     triggerAboveThreshold: event.params.triggerAboveThreshold,
  //     triggerPrice: event.params.triggerPrice,
  //     type: 'Increase',
  //     updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  //   })
  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","createdAtBlock": ' +
    event.block.number.toString() +
    ',"indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false')
  params +=
    ',"orderIndex": "' +
    event.params.orderIndex.toString() +
    '","sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerPrice": "' +
    event.params.triggerPrice.toString() +
    '","type": "Increase","updatedAt": ' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleCreateDecreaseOrder(event: CreateDecreaseOrder): void {
  _handleCreateOrder(
    event.params.account,
    'decrease',
    event.params.orderIndex,
    event.params.sizeDelta,
    event.block.timestamp
  )
  _storeStats('openDecrease', null)

  let action: string, params: string
  action = ActionCreateDecreaseOrder

  //   params = JSON.stringify({
  //     account: event.params.account,
  //     collateralDelta: event.params.collateralDelta,
  //     collateralToken: event.params.collateralToken,
  //     createdAtBlock: event.block.number,
  //     indexToken: event.params.indexToken,
  //     executionFee: event.params.executionFee,
  //     isLong: event.params.isLong,
  //     orderIndex: event.params.orderIndex,
  //     sizeDelta: event.params.sizeDelta,
  //     triggerAboveThreshold: event.params.triggerAboveThreshold,
  //     triggerPrice: event.params.triggerPrice,
  //     type: 'Decrease',
  //     updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  //   })
  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","collateralDelta": "' +
    event.params.collateralDelta.toString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","createdAtBlock": ' +
    event.block.number.toString() +
    ',"executionFee": "' +
    event.params.executionFee.toString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false')
  params +=
    ',"orderIndex": "' +
    event.params.orderIndex.toString() +
    '","sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerPrice": "' +
    event.params.triggerPrice.toString() +
    '","type": "Decrease","updatedAt": ' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleCancelDecreaseOrder(event: CancelDecreaseOrder): void {
  _handleCancelOrder(
    event.params.account,
    'decrease',
    event.params.orderIndex,
    event.block.timestamp
  )
  _storeStats('cancelledDecrease', 'openDecrease')

  let action: string, params: string
  action = ActionCancelDecreaseOrder

  // params = JSON.stringify({
  //   account: event.params.account,
  //   collateralDelta: event.params.collateralDelta,
  //   collateralToken: event.params.collateralToken,
  //   executionFee: event.params.executionFee,
  //   indexToken: event.params.indexToken,
  //   isLong: event.params.isLong,
  //   orderIndex: event.params.orderIndex,
  //   sizeDelta: event.params.sizeDelta,
  //   triggerAboveThreshold: event.params.triggerAboveThreshold,
  //   triggerPrice: event.params.triggerPrice,
  //   type: 'Decrease',
  //   updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  // })
  params =
    '{"order":{ "account": "' +
    event.params.account.toHexString() +
    '","collateralDelta": "' +
    event.params.collateralDelta.toString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","executionFee": "' +
    event.params.executionFee.toString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false')
  params +=
    ',"orderIndex": "' +
    event.params.orderIndex.toString() +
    '","sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerPrice": "' +
    event.params.triggerPrice.toString() +
    '","type": "Decrease","updatedAt": ' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleExecuteDecreaseOrder(event: ExecuteDecreaseOrder): void {
  _handleExecuteOrder(
    event.params.account,
    'decrease',
    event.params.orderIndex,
    event.block.timestamp
  )
  _storeStats('executedDecrease', 'openDecrease')

  let action: string, params: string
  action = ActionExecuteIncreaseOrder

  //   params = JSON.stringify({
  //     account: event.params.account,
  //     collateralDelta: event.params.collateralDelta,
  //     collateralToken: event.params.collateralToken,
  //     executionFee: event.params.executionFee,
  //     executionPrice: event.params.executionPrice,
  //     indexToken: event.params.indexToken,
  //     isLong: event.params.isLong,
  //     orderIndex: event.params.orderIndex,
  //     sizeDelta: event.params.sizeDelta,
  //     triggerAboveThreshold: event.params.triggerAboveThreshold,
  //     triggerPrice: event.params.triggerPrice,
  //     type: 'Decrease',
  //     updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  //   })
  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","collateralDelta": "' +
    event.params.collateralDelta.toString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","executionFee": "' +
    event.params.executionFee.toString() +
    '","executionPrice": "' +
    event.params.executionPrice.toString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false')
  params +=
    ',"orderIndex": "' +
    event.params.orderIndex.toString() +
    '","sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerPrice": "' +
    event.params.triggerPrice.toString() +
    '","type": "Decrease","updatedAt": ' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleUpdateDecreaseOrder(event: UpdateDecreaseOrder): void {
  let action: string, params: string
  action = ActionUpdateDecreaseOrder
  //   params = JSON.stringify({
  //     account: event.params.account,
  //     collateralDelta: event.params.collateralDelta,
  //     collateralToken: event.params.collateralToken,
  //     indexToken: event.params.indexToken,
  //     isLong: event.params.isLong,
  //     orderIndex: event.params.orderIndex,
  //     sizeDelta: event.params.sizeDelta,
  //     triggerAboveThreshold: event.params.triggerAboveThreshold,
  //     triggerPrice: event.params.triggerPrice,
  //     type: 'Decrease',
  //     updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  //   })
  //   params = `{
  //     account: "${event.params.account.toHexString()}",
  //     collateralDelta: "${event.params.collateralDelta.toString()}",
  //     collateralToken: "${event.params.collateralToken.toHexString()}",
  //     indexToken: "${event.params.indexToken.toHexString()}",
  //     isLong: ${event.params.isLong},
  //     orderIndex: "${event.params.orderIndex.toString()}",
  //     sizeDelta: "${event.params.sizeDelta.toString()}",
  //     triggerAboveThreshold: ${event.params.triggerAboveThreshold},
  //     triggerPrice: "${event.params.triggerPrice.toString()}",
  //     type: 'Decrease',
  //     updatedAt: ${event.block.timestamp.times(BigInt.fromI32(1000)).toString()},
  //   }`
  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","collateralDelta": "' +
    event.params.collateralDelta.toString() +
    '","collateralToken": "' +
    event.params.collateralToken.toHexString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false')
  params +=
    ',"orderIndex": "' +
    event.params.orderIndex.toString() +
    '","sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerPrice": "' +
    event.params.triggerPrice.toString() +
    '","type": "Decrease","updatedAt": ' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleCreateSwapOrder(event: CreateSwapOrder): void {
  let path = event.params.path
  let size = getTokenAmountUsd(path[0].toHexString(), event.params.amountIn)
  _handleCreateOrder(
    event.params.account,
    'swap',
    event.params.orderIndex,
    size,
    event.block.timestamp
  )
  _storeStats('openSwap', null)

  let action: string, params: string
  action = ActionCreateSwapOrder

  //   params = JSON.stringify({
  //     account: event.params.account,
  //     createdAtBlock: event.block.number,
  //     executionFee: event.params.executionFee,
  //     path: event.params.path,
  //     orderIndex: event.params.orderIndex,
  //     amountIn: event.params.amountIn,
  //     minOut: event.params.minOut,
  //     triggerAboveThreshold: event.params.triggerAboveThreshold,
  //     triggerRatio: event.params.triggerRatio,
  //     shouldUnwrap: event.params.shouldUnwrap,
  //     updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  //   })

  let pstr: string = '"' + path[0].toHexString() + '"'
  if (path.length > 1) {
    pstr += ',"' + path[1].toHexString() + '"'
  }
  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","createdAtBlock": "' +
    event.block.number.toString() +
    '","executionFee": "' +
    event.params.executionFee.toString() +
    '","path": [' +
    pstr +
    '],"orderIndex": "' +
    event.params.orderIndex.toString() +
    '","amountIn": "' +
    event.params.amountIn.toString()
  params +=
    '","minOut": "' +
    event.params.minOut.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerRatio": "' +
    event.params.triggerRatio.toString() +
    '","shouldUnwrap": ' +
    (event.params.shouldUnwrap ? 'true' : 'false') +
    ',"updatedAt": "' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '"}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleCancelSwapOrder(event: CancelSwapOrder): void {
  _handleCancelOrder(
    event.params.account,
    'swap',
    event.params.orderIndex,
    event.block.timestamp
  )
  _storeStats('cancelledSwap', 'openSwap')

  let action: string, params: string
  action = ActionCancelSwapOrder

  //   params = JSON.stringify({
  //     account: event.params.account,
  //     createdAtBlock: event.block.number,
  //     executionFee: event.params.executionFee,
  //     path: event.params.path,
  //     orderIndex: event.params.orderIndex,
  //     amountIn: event.params.amountIn,
  //     minOut: event.params.minOut,
  //     triggerAboveThreshold: event.params.triggerAboveThreshold,
  //     triggerRatio: event.params.triggerRatio,
  //     shouldUnwrap: event.params.shouldUnwrap,
  //     updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  //   })
  let path = event.params.path
  let pstr: string = '"' + path[0].toHexString() + '"'
  if (path.length > 1) {
    pstr += ',"' + path[1].toHexString() + '"'
  }
  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","createdAtBlock": "' +
    event.block.number.toString() +
    '","executionFee": "' +
    event.params.executionFee.toString() +
    '","path": [' +
    pstr +
    '],"orderIndex": "' +
    event.params.orderIndex.toString() +
    '","amountIn": "' +
    event.params.amountIn.toString()

  params +=
    '","minOut": "' +
    event.params.minOut.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerRatio": "' +
    event.params.triggerRatio.toString() +
    '","shouldUnwrap": ' +
    (event.params.shouldUnwrap ? 'true' : 'false') +
    ',"updatedAt": "' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '"}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleExecuteSwapOrder(event: ExecuteSwapOrder): void {
  _handleExecuteOrder(
    event.params.account,
    'swap',
    event.params.orderIndex,
    event.block.timestamp
  )
  _storeStats('executedSwap', 'openSwap')

  let action: string, params: string
  action = ActionExecuteSwapOrder

  //   params = JSON.stringify({
  //     account: event.params.account,
  //     createdAtBlock: event.block.number,
  //     executionFee: event.params.executionFee,
  //     path: event.params.path,
  //     orderIndex: event.params.orderIndex,
  //     amountIn: event.params.amountIn,
  //     minOut: event.params.minOut,
  //     triggerAboveThreshold: event.params.triggerAboveThreshold,
  //     triggerRatio: event.params.triggerRatio,
  //     shouldUnwrap: event.params.shouldUnwrap,
  //     updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  //   })
  let path = event.params.path
  let pstr: string = '"' + path[0].toHexString() + '"'
  if (path.length > 1) {
    pstr += ',"' + path[1].toHexString() + '"'
  }
  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","createdAtBlock": "' +
    event.block.number.toString() +
    '","executionFee": "' +
    event.params.executionFee.toString() +
    '","path": [' +
    pstr +
    '],"orderIndex": "' +
    event.params.orderIndex.toString() +
    '","amountIn": "' +
    event.params.amountIn.toString()
  params +=
    '","minOut": "' +
    event.params.minOut.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerRatio": "' +
    event.params.triggerRatio.toString() +
    '","shouldUnwrap": ' +
    (event.params.shouldUnwrap ? 'true' : 'false') +
    ',"updatedAt": "' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '"}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}

export function handleUpdateSwapOrder(event: UpdateSwapOrder): void {
  let action: string, params: string
  action = ActionUpdateSwapOrder

  //   params = JSON.stringify({
  //     account: event.params.account,
  //     createdAtBlock: event.block.number,
  //     executionFee: event.params.executionFee,
  //     path: event.params.path,
  //     orderIndex: event.params.orderIndex,
  //     amountIn: event.params.amountIn,
  //     minOut: event.params.minOut,
  //     triggerAboveThreshold: event.params.triggerAboveThreshold,
  //     triggerRatio: event.params.triggerRatio,
  //     shouldUnwrap: event.params.shouldUnwrap,
  //     updatedAt: event.block.timestamp.times(BigInt.fromI32(1000)),
  //   })
  let path = event.params.path
  let pstr: string = '"' + path[0].toHexString() + '"'
  if (path.length > 1) {
    pstr += ',"' + path[1].toHexString() + '"'
  }
  params =
    '{"order":{"account": "' +
    event.params.account.toHexString() +
    '","createdAtBlock": "' +
    event.block.number.toString() +
    '","executionFee": "' +
    event.params.executionFee.toString() +
    '","path": [' +
    pstr +
    '],"orderIndex": "' +
    event.params.ordexIndex.toString() +
    '","amountIn": "' +
    event.params.amountIn.toString()
  params +=
    '","minOut": "' +
    event.params.minOut.toString() +
    '","triggerAboveThreshold": ' +
    (event.params.triggerAboveThreshold ? 'true' : 'false') +
    ',"triggerRatio": "' +
    event.params.triggerRatio.toString() +
    '","shouldUnwrap": ' +
    (event.params.shouldUnwrap ? 'true' : 'false') +
    ',"updatedAt": "' +
    event.block.timestamp.times(BigInt.fromI32(1000)).toString() +
    '"}}'
  _createActionIfNotExist(
    event,
    action,
    event.params.account.toHexString(),
    params
  )
}
