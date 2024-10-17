import {
  AddLiquidity as AddLiquidityEvent,
  RemoveLiquidity as RemoveLiquidityEvent
} from "../generated/GlpManager/GlpManager";
import { AddLiquidity, RemoveLiquidity, Transaction } from "../generated/schema";
import { storeGlpStat } from "./glp-schema-helpers";

export function handleAddLiquidity(event: AddLiquidityEvent): void {
  storeGlpStat(
    event.block.timestamp,
    event.params.glpSupply,
    event.params.aumInUsdg
  )
  // From raw
  {
    let entity = new AddLiquidity(event.transaction.hash.toHexString())

    entity.account = event.params.account.toHexString()
    entity.token = event.params.token.toHexString()
    entity.amount = event.params.amount
    entity.aumInUsdg = event.params.aumInUsdg
    entity.glpSupply = event.params.glpSupply
    entity.usdgAmount = event.params.usdgAmount
    entity.mintAmount = event.params.mintAmount

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

export function handleRemoveLiquidity(event: RemoveLiquidityEvent): void {
  storeGlpStat(
    event.block.timestamp,
    event.params.glpSupply,
    event.params.aumInUsdg
  )
  // from raw
  {
    let entity = new RemoveLiquidity(event.transaction.hash.toHexString())

    entity.account = event.params.account.toHexString()
    entity.token = event.params.token.toHexString()
    entity.glpAmount = event.params.glpAmount
    entity.aumInUsdg = event.params.aumInUsdg
    entity.glpSupply = event.params.glpSupply
    entity.usdgAmount = event.params.usdgAmount
    entity.amountOut = event.params.amountOut

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