import {
  CreateIncreasePosition as CreateIncreasePositionEvent,
  CreateDecreasePosition as CreateDecreasePositionEvent,
  CancelIncreasePosition as CancelIncreasePositionEvent,
  CancelDecreasePosition as CancelDecreasePositionEvent
} from "../generated/PositionRouter/PositionRouter"
import { Action, CreateDecreasePosition, CreateIncreasePosition, Transaction } from "../generated/schema"
import { ActionCancelDecreasePosition, ActionCancelIncreasePosition, ActionCreateDecreasePosition, ActionCreateIncreasePosition } from "./const"

export function handleCreateIncreasePosition(event: CreateIncreasePositionEvent): void {
  let action: string, params: string
  action = ActionCreateIncreasePosition
  params =
    '{"acceptablePrice": "' +
    event.params.acceptablePrice.toString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false') +
    ',"sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '"}'
  //   params = JSON.stringify({
  //     acceptablePrice: event.params.acceptablePrice,
  //     indexToken: event.params.indexToken,
  //     isLong: event.params.isLong,
  //     sizeDelta: event.params.sizeDelta,
  //   })
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
  // From raw
  {
    let id = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
    let entity = new CreateIncreasePosition(id)

    entity.account = event.params.account.toHexString()
    let path = event.params.path
    entity.collateralToken = path[path.length - 1].toHexString()
    entity.indexToken = event.params.indexToken.toHexString()
    entity.sizeDelta = event.params.sizeDelta
    entity.amountIn = event.params.amountIn
    entity.isLong = event.params.isLong
    entity.acceptablePrice = event.params.acceptablePrice
    entity.executionFee = event.params.executionFee

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

export function handleCreateDecreasePosition(event: CreateDecreasePositionEvent): void {
  let action: string, params: string
  action = ActionCreateDecreasePosition
  // params = JSON.stringify({
  //   acceptablePrice: event.params.acceptablePrice,
  //   indexToken: event.params.indexToken,
  //   isLong: event.params.isLong,
  //   sizeDelta: event.params.sizeDelta,
  //   collateralDelta: event.params.collateralDelta,
  // })
  params =
    '{"acceptablePrice": "' +
    event.params.acceptablePrice.toString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false') +
    ',"sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '","collateralDelta": "' +
    event.params.collateralDelta.toString() +
    '"}'
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
  // From raw
  {
    let id = event.transaction.hash.toHexString() + ":" + event.logIndex.toString()
    let entity = new CreateDecreasePosition(id)

    entity.account = event.params.account.toHexString()
    let path = event.params.path
    entity.collateralToken = path[0].toHexString()
    entity.indexToken = event.params.indexToken.toHexString()
    entity.sizeDelta = event.params.sizeDelta
    entity.isLong = event.params.isLong
    entity.acceptablePrice = event.params.acceptablePrice
    entity.executionFee = event.params.executionFee

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

export function handleCancelIncreasePosition(event: CancelIncreasePositionEvent): void {
  let action: string, params: string
  action = ActionCancelIncreasePosition
  // params = JSON.stringify({
  //   acceptablePrice: event.params.acceptablePrice,
  //   indexToken: event.params.indexToken,
  //   isLong: event.params.isLong,
  //   sizeDelta: event.params.sizeDelta,
  // })
  // params = `{
  //   "acceptablePrice": "${event.params.acceptablePrice.toString()}",
  //   "indexToken": "${event.params.indexToken.toHexString()}",
  //   "isLong": ${event.params.isLong},
  //   "sizeDelta": "${event.params.sizeDelta.toString()}",
  //   }`
  params =
    '{"acceptablePrice": "' +
    event.params.acceptablePrice.toString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false') +
    ',"sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '"}'
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

export function handleCancelDecreasePosition(event: CancelDecreasePositionEvent): void {
  let action: string, params: string
  action = ActionCancelDecreasePosition
  //   params = JSON.stringify({
  //     acceptablePrice: event.params.acceptablePrice,
  //     indexToken: event.params.indexToken,
  //     isLong: event.params.isLong,
  //     sizeDelta: event.params.sizeDelta,
  //     collateralDelta: event.params.collateralDelta,
  //   })
  //   params = `{
  //     "acceptablePrice": "${event.params.acceptablePrice.toString()}",
  //     "indexToken": "${event.params.indexToken.toHexString()}",
  //     "isLong": ${event.params.isLong},
  //     "sizeDelta": "${event.params.sizeDelta.toString()}",
  //     "collateralDelta": "${event.params.collateralDelta.toString()}",
  //     }`
  params =
    '{"acceptablePrice": "' +
    event.params.acceptablePrice.toString() +
    '","indexToken": "' +
    event.params.indexToken.toHexString() +
    '","isLong": ' +
    (event.params.isLong ? 'true' : 'false') +
    ',"sizeDelta": "' +
    event.params.sizeDelta.toString() +
    '","collateralDelta": "' +
    event.params.collateralDelta.toString() +
    '"}'
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