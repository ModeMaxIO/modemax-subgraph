import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { Transfer as TransferEvent } from '../generated/templates/MarketTokenTemplate/MarketToken'
import { DECIMAL18, ZeroAddress } from './const';
import { createUserLiquiditySnap, loadOrCreateUserLiquidity } from './schema';
import { loadOrCreateUserStat } from './event-emitter-schema-helper';

export function handleMarketTokenTransfer(event: TransferEvent): void {
  let from = event.params.from.toHexString();
  let to = event.params.to.toHexString();
  let value = event.params.value;

  if (from != ZeroAddress) {
    // remove
    _storeUserLiquidity(from, event.block.timestamp.toI32(), value.neg());
  }

  if (to != ZeroAddress) {
    // add
    _storeUserLiquidity(to, event.block.timestamp.toI32(), value);
  }

}

function _storeUserLiquidity(account: string, timestamp: i32, value: BigInt): void {
  const userLiquidity = loadOrCreateUserLiquidity(account);
  if (userLiquidity.latesUpdateTimestamp > 0) {
    const gainedPointBase = userLiquidity.lp.times(BigInt.fromI32(timestamp - userLiquidity.latesUpdateTimestamp));
    userLiquidity.basePoints = userLiquidity.basePoints.plus(gainedPointBase);
  }
  // update
  userLiquidity.latesUpdateTimestamp = timestamp;
  userLiquidity.lp = userLiquidity.lp.plus(value);
  userLiquidity.save();
  createUserLiquiditySnap(account, userLiquidity.latesUpdateTimestamp, userLiquidity.lp, userLiquidity.basePoints);
  const userData = loadOrCreateUserStat(account);
  userData.lp = userLiquidity.lp.toBigDecimal().div(DECIMAL18);
  userData.save();
}