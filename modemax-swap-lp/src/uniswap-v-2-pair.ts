import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Pair, Token } from "../generated/schema";
import {
  Swap as SwapEvent,
  Transfer as TransferEvent,
  Sync as SyncEvent
} from "../generated/templates/UniswapV2Pair/UniswapV2Pair";
import { DECIMAL18, ZeroAddress } from "./helpers/const";
import { createUserLiquiditySnap, loadOrCreateUserLiquidity } from "./helpers/schema-helper";
import { convertTokenToDecimal } from "./helpers/utils";
import { findUSDPerToken, saveTokenPrice } from "./helpers/pricing";

export function handleSwap(event: SwapEvent): void {

}

export function handleTransfer(event: TransferEvent): void {
  const from = event.params.from;
  const to = event.params.to;
  const value = event.params.value.toBigDecimal().div(DECIMAL18);
  const pair = Pair.load(event.address.toHexString());
  if (!pair) {
    return;
  }
  // burn
  if (to.toHexString() == ZeroAddress && from.toHexString() == pair.id) {
    pair.totalSupply = pair.totalSupply.minus(value);
    pair.save();
  }
  // mint
  if (from.toHexString() == ZeroAddress) {
    pair.totalSupply = pair.totalSupply.plus(value)
    pair.save();
  }
  const valueUSD = value.times(pair.reserveUSD).div(pair.totalSupply);

  // add
  if (to.toHexString() != ZeroAddress && to.toHexString() != pair.id) {
    _storeUserLiquidity(to.toHexString(), event.block.timestamp.toI32(), value, valueUSD);
  }
  // remove
  if (from.toHexString() != ZeroAddress && from.toHexString() != pair.id) {
    _storeUserLiquidity(from.toHexString(), event.block.timestamp.toI32(),value, valueUSD.neg());
  }

}

function _storeUserLiquidity(account: string, timestamp: i32, value: BigDecimal, valueUSD: BigDecimal): void {
  const userLiquidity = loadOrCreateUserLiquidity(account);
  if (userLiquidity.latestUpdateTimestamp > 0) {
    const gainedPointBase = userLiquidity.lpUSD.times(BigDecimal.fromString((timestamp - userLiquidity.latestUpdateTimestamp).toString()));
    userLiquidity.basePoints = userLiquidity.basePoints.plus(gainedPointBase);
  }
  // update
  userLiquidity.latestUpdateTimestamp = timestamp;
  userLiquidity.lp = userLiquidity.lp.plus(value);
  userLiquidity.lpUSD = userLiquidity.lpUSD.plus(valueUSD);
  userLiquidity.save();
  createUserLiquiditySnap(account, userLiquidity.latestUpdateTimestamp, userLiquidity.lp, userLiquidity.lpUSD,userLiquidity.basePoints);

}

export function handleSync(event: SyncEvent): void {
  let pair = Pair.load(event.address.toHexString());
  if (!pair) {
    return;
  }
  const token0 = Token.load(pair.token0);
  if (!token0) {
    return;
  }
  const token1 = Token.load(pair.token1);
  if (!token1) {
    return;
  }
  pair.reserve0 = convertTokenToDecimal(event.params.reserve0, token0.decimals);
  pair.reserve1 = convertTokenToDecimal(event.params.reserve1, token1.decimals);
  pair.save();

  /// NEED after saveTokenPrice?
  token0.derivedUSD = findUSDPerToken(token0);
  token0.save()
  token1.derivedUSD = findUSDPerToken(token1);
  token1.save()

  saveTokenPrice(token0, pair.id)
  saveTokenPrice(token1, pair.id);

  /// NEED after saveTokenPrice?
  token0.derivedUSD = findUSDPerToken(token0);
  token0.save()
  token1.derivedUSD = findUSDPerToken(token1);
  token1.save()

  pair.reserveUSD = pair.reserve0.times(token0.derivedUSD).
    plus(pair.reserve1.times(token1.derivedUSD));
  pair.save()
}