import { BigInt } from "@graphprotocol/graph-ts";
import {
  CreateIncreaseOrder as CreateIncreaseOrderEvent,
  CancelIncreaseOrder as CancelIncreaseOrderEvent,
  ExecuteIncreaseOrder as ExecuteIncreaseOrderEvent,
  UpdateIncreaseOrder as UpdateIncreaseOrderEvent,
  CreateDecreaseOrder as CreateDecreaseOrderEvent,
  CancelDecreaseOrder as CancelDecreaseOrderEvent,
  ExecuteDecreaseOrder as ExecuteDecreaseOrderEvent,
  UpdateDecreaseOrder as UpdateDecreaseOrderEvent,
  CreateSwapOrder as CreateSwapOrderEvent,
  CancelSwapOrder as CancelSwapOrderEvent,
  ExecuteSwapOrder as ExecuteSwapOrderEvent,
  UpdateSwapOrder as UpdateSwapOrderEvent,
} from "../generated/OrderBook/OrderBook";
import { ActionCancelDecreaseOrder, ActionCancelIncreaseOrder, ActionCancelSwapOrder, ActionCreateDecreaseOrder, ActionCreateIncreaseOrder, ActionCreateSwapOrder, ActionExecuteIncreaseOrder, ActionExecuteSwapOrder, ActionUpdateDecreaseOrder, ActionUpdateIncreaseOrder, ActionUpdateSwapOrder, BI_ZERO } from "./const";
import { cancelOrder, createOrder, executeOrder, storeStats } from "./order-book-schema-helpers";
import { Action } from "../generated/schema";

export function handleCreateIncreaseOrder(event: CreateIncreaseOrderEvent): void {
  createOrder(
    event.params.account,
    'increase',
    event.params.orderIndex,
    event.params.sizeDelta,
    event.block.timestamp
  )
  storeStats('openIncrease', null)

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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleCancelIncreaseOrder(event: CancelIncreaseOrderEvent): void {
  cancelOrder(
    event.params.account,
    'increase',
    event.params.orderIndex,
    event.block.timestamp
  )
  storeStats('cancelledIncrease', 'openIncrease')

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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleExecuteIncreaseOrder(event: ExecuteIncreaseOrderEvent): void {
  executeOrder(
    event.params.account,
    'increase',
    event.params.orderIndex,
    event.block.timestamp
  )
  storeStats('executedIncrease', 'openIncrease')

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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleUpdateIncreaseOrder(event: UpdateIncreaseOrderEvent): void {
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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleCreateDecreaseOrder(event: CreateDecreaseOrderEvent): void {
  createOrder(
    event.params.account,
    'decrease',
    event.params.orderIndex,
    event.params.sizeDelta,
    event.block.timestamp
  )
  storeStats('openDecrease', null)

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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleCancelDecreaseOrder(event: CancelDecreaseOrderEvent): void {
  cancelOrder(
    event.params.account,
    'decrease',
    event.params.orderIndex,
    event.block.timestamp
  )
  storeStats('cancelledDecrease', 'openDecrease')

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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleExecuteDecreaseOrder(event: ExecuteDecreaseOrderEvent): void {
  executeOrder(
    event.params.account,
    'decrease',
    event.params.orderIndex,
    event.block.timestamp
  )
  storeStats('executedDecrease', 'openDecrease')

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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleUpdateDecreaseOrder(event: UpdateDecreaseOrderEvent): void {
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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleCreateSwapOrder(event: CreateSwapOrderEvent): void {
  let path = event.params.path
  // TODO
  // let size = getTokenAmountUsd(path[0].toHexString(), event.params.amountIn)
  let size = BI_ZERO;
  createOrder(
    event.params.account,
    'swap',
    event.params.orderIndex,
    size,
    event.block.timestamp
  )
  storeStats('openSwap', null)

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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleCancelSwapOrder(event: CancelSwapOrderEvent): void {
  cancelOrder(
    event.params.account,
    'swap',
    event.params.orderIndex,
    event.block.timestamp
  )
  storeStats('cancelledSwap', 'openSwap')

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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }

}

export function handleExecuteSwapOrder(event: ExecuteSwapOrderEvent): void {
  executeOrder(
    event.params.account,
    'swap',
    event.params.orderIndex,
    event.block.timestamp
  )
  storeStats('executedSwap', 'openSwap')

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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}

export function handleUpdateSwapOrder(event: UpdateSwapOrderEvent): void {
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
  // _createActionIfNotExist
  {
    let id = event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    let entity = Action.load(id)
    if (!entity) {
      entity = new Action(id)
      entity.timestamp = event.block.timestamp.toI32()
      entity.blockNumber = event.block.number.toI32()
      entity.txhash = event.transaction.hash.toHexString()
      entity.transactionIndex = event.transaction.index.toI32()
      entity.from = event.params.account.toHexString()
      entity.to = ''
      entity.action = action
      entity.params = params
      entity.save()
    }
  }
}