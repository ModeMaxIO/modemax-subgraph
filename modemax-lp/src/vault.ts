import { BigDecimal, dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  IncreasePosition as IncreasePositionEvent,
  DecreasePosition as DecreasePositionEvent,
  UpdatePosition as UpdatePositionEvent,
  ClosePosition as ClosePositionEvent,
  LiquidatePosition as LiquidatePositionEvent,
  Swap as SwapEvent,
} from "../generated/Vault/Vault";
import { createVault, ignoreOrCreateLeaderboardSnapOfPrevDay, loadOrCreateLeaderboard, storeReferralOfUserStat, storeUserCollateral } from "./schema-helper";
import { DECIMAL30 } from "./const";
import { Position } from "../generated/schema";
import { getMarketTokenPriceV1 } from "./v1-healper";

export function handleOnce(block: ethereum.Block): void {
  createVault(dataSource.address());
}

export function handleIncreasePosition(event: IncreasePositionEvent): void {
  const account = event.params.account.toHexString()
  {
    const positionId = event.params.key.toHexString();
    let position = Position.load(positionId);
    if (!position) {
      position = new Position(positionId);
      position.account = account;
      position.timestamp = event.block.timestamp.toI32();
      position.save();
    }
  }
  // event.params.collateralDelta is priced with usd
  // storeUserCollateral(account, event.block.timestamp, event.params.collateralToken, );
  storeReferralOfUserStat(account, event.params.sizeDelta);
  _storeLeaderboard(account, event.block.timestamp.toI32(), event.params.sizeDelta.toBigDecimal().div(DECIMAL30), true);
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  const account = event.params.account.toHexString()
  storeReferralOfUserStat(account, event.params.sizeDelta);
  _storeLeaderboard(account, event.block.timestamp.toI32(), event.params.sizeDelta.toBigDecimal().div(DECIMAL30), false);
}

export function handleUpdatePosition(event: UpdatePositionEvent): void {
  const positionId = event.params.key.toHexString();
  const position = Position.load(positionId);
  if (position) {
    _storeLeaderboardNetProfit(position.account, event.block.timestamp.toI32(), event.params.realisedPnl.toBigDecimal().div(DECIMAL30));
  }
}

export function handleClosePosition(event: ClosePositionEvent): void {
  const positionId = event.params.key.toHexString();
  const position = Position.load(positionId);
  if (position) {
    _storeLeaderboardNetProfit(position.account, event.block.timestamp.toI32(), event.params.realisedPnl.toBigDecimal().div(DECIMAL30));
  }
}

export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
  const positionId = event.params.key.toHexString();
  const position = Position.load(positionId);
  if (position) {
    _storeLeaderboardNetProfit(position.account, event.block.timestamp.toI32(), event.params.realisedPnl.toBigDecimal().div(DECIMAL30));
  }
}

export function handleSwap(event: SwapEvent): void {
  const marketPrice = getMarketTokenPriceV1(event.params.tokenIn.toHexString(), event.block.timestamp.toI32())
  const swapUSD = event.params.amountIn.toBigDecimal().times(marketPrice.toBigDecimal()).div(DECIMAL30);
  _storeLeaderboardSwap(event.params.account.toHexString(), event.block.timestamp.toI32(), swapUSD);
}

// store margin and tradingVolume
function _storeLeaderboard(account: string, timestamp: i32, sizeDelta: BigDecimal, isIncrease: boolean): void {
  ignoreOrCreateLeaderboardSnapOfPrevDay(account, timestamp);
  const leaderboard = loadOrCreateLeaderboard(account);
  if (isIncrease) {
    leaderboard.margin = leaderboard.margin.plus(sizeDelta);
  } else {
    leaderboard.margin = leaderboard.margin.minus(sizeDelta);
  }
  leaderboard.tradingVolume = leaderboard.tradingVolume.plus(sizeDelta);
  leaderboard.latestUpdateTimestamp = timestamp;
  leaderboard.save()
}

function _storeLeaderboardNetProfit(account: string, timestamp: i32, netProfit: BigDecimal): void {
  ignoreOrCreateLeaderboardSnapOfPrevDay(account, timestamp);
  const leaderboard = loadOrCreateLeaderboard(account);
  leaderboard.netProfit = leaderboard.netProfit.plus(netProfit);
  leaderboard.save();
}

function _storeLeaderboardSwap(account: string, timestamp: i32, swap: BigDecimal): void {
  ignoreOrCreateLeaderboardSnapOfPrevDay(account, timestamp);
  const leaderboard = loadOrCreateLeaderboard(account);
  leaderboard.swap = leaderboard.swap.plus(swap);
  leaderboard.save();
}