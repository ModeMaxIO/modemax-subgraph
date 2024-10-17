import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Order, OrderStat } from "../generated/schema"


function _getId(account: Address, type: string, index: BigInt): string {
  let id = account.toHexString() + '-' + type + '-' + index.toString()
  return id
}

export function createOrder(
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

export function cancelOrder(
  account: Address,
  type: string,
  index: BigInt,
  timestamp: BigInt
): void {
  let id = account.toHexString() + '-' + type + '-' + index.toString()
  let order = Order.load(id)

  if (!order) {
    return;
  }
  order.status = 'cancelled'
  order.cancelledTimestamp = timestamp.toI32()

  order.save()
}

export function executeOrder(
  account: Address,
  type: string,
  index: BigInt,
  timestamp: BigInt
): void {
  let id = account.toHexString() + '-' + type + '-' + index.toString()
  let order = Order.load(id)
  if (!order) {
    return;
  }
  order.status = 'executed'
  order.executedTimestamp = timestamp.toI32()

  order.save()
}

export function storeStats(
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
  if (decrementProp) {
    entity.setI32(decrementProp, entity.getI32(decrementProp) - 1)
  }

  entity.save()
}