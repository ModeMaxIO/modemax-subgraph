import {
  StakeWlp as StakeWlpEvent,
  UnstakeWlp as UnstakeWlpEvent,
  StakeWmx as StakeWmxEvent,
  UnstakeWmx as UnstakeWmxEvent
} from "../generated/RewardRouterMT/RewardRouterMT"
import { StakeWlp, StakeWmx, Transaction, UnstakeWlp, UnstakeWmx } from "../generated/schema"

export function handleStakeWlp(event: StakeWlpEvent): void {
  let entity = new StakeWlp(event.transaction.hash.toHexString())

  entity.account = event.params.account.toHexString()
  entity.amount = event.params.amount

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

export function handleUnstakeWlp(event: UnstakeWlpEvent): void {
  let entity = new UnstakeWlp(event.transaction.hash.toHexString())

  entity.account = event.params.account.toHexString()
  entity.amount = event.params.amount

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

export function handleStakeWmx(event: StakeWmxEvent): void {
  let entity = new StakeWmx(event.transaction.hash.toHexString())

  entity.account = event.params.account.toHexString()
  entity.token = event.params.token.toHexString()
  entity.amount = event.params.amount

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

export function handleUnstakeWmx(event: UnstakeWmxEvent): void {
  let entity = new UnstakeWmx(event.transaction.hash.toHexString())

  entity.account = event.params.account.toHexString()
  entity.token = event.params.token.toHexString()
  entity.amount = event.params.amount

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