import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Pair, Token, TokenPrice } from "../generated/schema";
import {
  Swap as SwapEvent,
  Transfer as TransferEvent,
  Sync as SyncEvent
} from "../generated/templates/UniswapV2Pair/UniswapV2Pair";
import { BD_ZERO, DECIMAL18, feeTeams, ZeroAddress } from "./helpers/const";
import { createUserLiquiditySnap, createUserSwapSnap, ignoreOrCreatePairFeeSnapOfPrevHour, ignoreOrCreatePairSwapSnapOfPrevHour, loadOrCreatePairFee, loadOrCreatePairSwap, loadOrCreateUserLiquidity, loadOrCreateUserSwap } from "./helpers/schema-helper";
import { convertTokenToDecimal } from "./helpers/utils";
import { findUSDPerToken, saveTokenPrice } from "./helpers/pricing";

export function handleSwap(event: SwapEvent): void {
  const pair = Pair.load(event.address.toHexString())
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
  const timestamp = event.block.timestamp.toI32();
  const amount0In = convertTokenToDecimal(event.params.amount0In, token0.decimals);
  const amount1In = convertTokenToDecimal(event.params.amount1In, token1.decimals);
  // const amount0Out = convertTokenToDecimal(event.params.amount0Out, token0.decimals);
  // const amount1Out = convertTokenToDecimal(event.params.amount1Out, token1.decimals);

  const token0Price = TokenPrice.load(token0.id);
  let token0USD = BD_ZERO;
  if (token0Price) {
    token0USD = token0Price.priceUSD;
  }
  const token1Price = TokenPrice.load(token1.id);
  let token1USD = BD_ZERO;
  if (token1Price) {
    token1USD = token1Price.priceUSD;
  }
  const value = amount0In.plus(amount1In);
  const valueUSD = amount0In.times(token0USD).plus(amount1In.times(token1USD))
  {
    ignoreOrCreatePairSwapSnapOfPrevHour(pair, timestamp);
    const pairSwap = loadOrCreatePairSwap(pair);
    pairSwap.swapUsd = pairSwap.swapUsd.plus(valueUSD);
    pairSwap.latestUpdateTimestamp = timestamp;
    pairSwap.save();
    pair.save();
  }
  
  _storeUserSwap(event.params.to.toHexString(), event.block.timestamp.toI32(), value, valueUSD)
}

function _storeUserSwap(account: string, timestamp: i32, value: BigDecimal, valueUSD: BigDecimal): void {
  const userLiquidity = loadOrCreateUserSwap(account);
  // update
  userLiquidity.latestUpdateTimestamp = timestamp;
  userLiquidity.swap = userLiquidity.swap.plus(value);
  userLiquidity.swapUSD = userLiquidity.swapUSD.plus(valueUSD);
  userLiquidity.save();
  createUserSwapSnap(account, userLiquidity.latestUpdateTimestamp, userLiquidity.swap, userLiquidity.swapUSD);
}

export function handleTransfer(event: TransferEvent): void {
  // ignore initial transfers for first adds
  if (event.params.to.toHexString() == ZeroAddress && event.params.value.equals(BigInt.fromI32(1000))) {
    return
  }
  const from = event.params.from;
  const to = event.params.to;
  const value = event.params.value.toBigDecimal().div(DECIMAL18);
  const pair = Pair.load(event.address.toHexString());
  if (!pair) {
    return;
  }
  let valueUSD = BD_ZERO;
  if (pair.totalSupply.gt(BD_ZERO)) {
    valueUSD = value.times(pair.reserveUSD).div(pair.totalSupply);
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
    // fee
    for(let i = 0; i < feeTeams.length; i++) {
      const ft = feeTeams[i];
      if (ft.toHexString() == to.toHexString()) {
        const timestamp = event.block.timestamp.toI32();
        ignoreOrCreatePairFeeSnapOfPrevHour(pair, timestamp);
        const fee = loadOrCreatePairFee(pair);
        fee.feeUsd = fee.feeUsd.plus(valueUSD);
        fee.latestUpdateTimestamp = timestamp;
        fee.save();
        pair.save();
      }
    }
    
  }

  // add
  if (to.toHexString() != ZeroAddress && to.toHexString() != pair.id) {
    _storeUserLiquidity(to.toHexString(), event.block.timestamp.toI32(), event.address.toHexString(), value);
  }
  // remove
  if (from.toHexString() != ZeroAddress && from.toHexString() != pair.id) {
    _storeUserLiquidity(from.toHexString(), event.block.timestamp.toI32(), event.address.toHexString(), value.neg());
  }

}

function _storeUserLiquidity(account: string, timestamp: i32, targetPair: string, value: BigDecimal): void {
  const userLiquidity = loadOrCreateUserLiquidity(account);
  let foundTarget = false;
  if (userLiquidity.latestUpdateTimestamp > 0) {
    const pointsIndex = BigDecimal.fromString((timestamp - userLiquidity.latestUpdateTimestamp).toString());
    let gainedPointBase = BD_ZERO;
    const lps = userLiquidity.lps;
    const derivedUSDs = userLiquidity.derivedUSDs;
    for (let i = 0; i < userLiquidity.pairs.length; i++) {
      const pairAddr = userLiquidity.pairs[i];
      const prevDerivedUSDs = derivedUSDs[i];
      const lp = lps[i];
      const pair = Pair.load(pairAddr);
      let midDerivedUSD = BD_ZERO;
      if (pair) {
        let nowDerivedUSD = BD_ZERO;
        if (pair.totalSupply.gt(BD_ZERO)) {
          nowDerivedUSD = pair.reserveUSD.div(pair.totalSupply);
        }
        midDerivedUSD = prevDerivedUSDs.plus(nowDerivedUSD).div(BigDecimal.fromString('2'));
        derivedUSDs[i] = nowDerivedUSD
      } else {
        midDerivedUSD = prevDerivedUSDs;
      }
      if (pairAddr == targetPair) {
        lps[i] = lps[i].plus(value);
        foundTarget = true;
      }
      gainedPointBase = gainedPointBase.plus(lp.times(midDerivedUSD).times(pointsIndex));
    }
    userLiquidity.lps = lps;
    userLiquidity.derivedUSDs = derivedUSDs;
    userLiquidity.basePoints = userLiquidity.basePoints.plus(gainedPointBase);
  }
  // update
  userLiquidity.latestUpdateTimestamp = timestamp;
  if (!foundTarget) {
    let nowDerivedUSD = BD_ZERO;
    const pair = Pair.load(targetPair);
    if (pair) {
      if (pair.totalSupply.gt(BD_ZERO)) {
        nowDerivedUSD = pair.reserveUSD.div(pair.totalSupply);
      }
    }
    const lps = userLiquidity.lps;
    lps.push(value);
    userLiquidity.lps = lps;
    const pairs = userLiquidity.pairs;
    pairs.push(targetPair);
    userLiquidity.pairs = pairs;
    const derivedUSDs = userLiquidity.derivedUSDs;
    derivedUSDs.push(nowDerivedUSD);
    userLiquidity.derivedUSDs = derivedUSDs;
  }
  userLiquidity.save();
  createUserLiquiditySnap(account, userLiquidity.latestUpdateTimestamp, userLiquidity.lps, userLiquidity.pairs, userLiquidity.derivedUSDs, userLiquidity.basePoints);

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