import { BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Action } from '../generated/schema'

export const ActionSellUSDG = 'SellUSDG'
export const ActionSwap = 'Swap'
export const ActionCreateIncreasePosition = 'CreateIncreasePosition'
export const ActionCreateDecreasePosition = 'CreateDecreasePosition'
export const ActionCancelIncreasePosition = 'CancelIncreasePosition'
export const ActionCancelDecreasePosition = 'CancelDecreasePosition'
export const ActionIncreasePositionLong = 'IncreasePosition-Long'
export const ActionIncreasePositionShort = 'IncreasePosition-Short'
export const ActionDecreasePositionLong = 'DecreasePosition-Long'
export const ActionDecreasePositionShort = 'DecreasePosition-Short'
export const ActionLiquidatePositionLong = 'LiquidatePosition-Long'
export const ActionLiquidatePositionShort = 'LiquidatePosition-Short'
export const ActionExecuteIncreaseOrder = 'ExecuteIncreaseOrder'
export const ActionExecuteDecreaseOrder = 'ExecuteDecreaseOrder'
export const ActionCreateIncreaseOrder = 'CreateIncreaseOrder'
export const ActionCancelIncreaseOrder = 'CancelIncreaseOrder'
export const ActionUpdateIncreaseOrder = 'UpdateIncreaseOrder'
export const ActionCreateDecreaseOrder = 'CreateDecreaseOrder'
export const ActionCancelDecreaseOrder = 'CancelDecreaseOrder'
export const ActionUpdateDecreaseOrder = 'UpdateDecreaseOrder'
export const ActionExecuteSwapOrder = 'ExecuteSwapOrder'
export const ActionCreateSwapOrder = 'CreateSwapOrder'
export const ActionUpdateSwapOrder = 'UpdateSwapOrder'
export const ActionCancelSwapOrder = 'CancelSwapOrder'

function _generateIdFromEvent(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + ':' + event.logIndex.toString()
}

export function _createActionIfNotExist(
  event: ethereum.Event,
  action: string,
  account: string,
  params: string
): string {
  let id = _generateIdFromEvent(event)
  let entity = Action.load(id)

  if (entity == null) {
    entity = new Action(id)
    entity.timestamp = event.block.timestamp.toI32()
    entity.blockNumber = event.block.number.toI32()
    entity.txhash = event.transaction.hash.toHexString()
    entity.transactionIndex = event.transaction.index.toI32()
    entity.from = account
    if (event.transaction.to == null) {
      entity.to = ''
    } else {
      entity.to = event.transaction.to.toHexString()
    }

    entity.action = action
    entity.params = params
    entity.save()
  }

  return id
}
