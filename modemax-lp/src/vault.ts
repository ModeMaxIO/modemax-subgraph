import { Address, BigDecimal, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  IncreasePosition as IncreasePositionEvent,
  DecreasePosition as DecreasePositionEvent,
  UpdatePosition as UpdatePositionEvent,
  ClosePosition as ClosePositionEvent,
  LiquidatePosition as LiquidatePositionEvent,
  Swap as SwapEvent,
  Vault as VaultContract,
} from "../generated/Vault/Vault";
import {
  ERC20 as ERC20Contract
} from "../generated/Vault/ERC20";
import { createVault, ignoreOrCreateLeaderboardSnapOfPrevHour, loadOrCreateLeaderboard, saveCollateralPrice, storeReferralOfUserStat, storeUserCollateral } from "./schema-helper";
import { BI_ONE, DECIMAL30 } from "./const";
import { Leaderboard, Position, Token } from "../generated/schema";
import { getMarketTokenPriceV1, getMinPriveV1 } from "./v1-healper";
import { exponentToBigDecimal } from "./helpers";
import { getReferralCode, getReferralCodeOwner } from "./referral-storage-schema-helper";

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
  {
    let collateralTokenPrice = getMinPriveV1(event.params.collateralToken.toHexString());
    const token = _loadOrStoreToken(event.params.collateralToken,event.address)
    const collateralDelta = event.params.collateralDelta.times(BigInt.fromI32(10).pow(token.vaultDecimals as u8)).div(collateralTokenPrice);
    collateralTokenPrice = collateralTokenPrice.div(BigInt.fromI32(10).pow(token.decimals as u8))
    saveCollateralPrice(event.params.collateralToken.toHexString(), collateralTokenPrice.toBigDecimal(), event.block.timestamp.toI32());
    storeUserCollateral(account, event.block.timestamp.toI32(), event.params.collateralToken.toHexString(), collateralDelta)
  }
  storeReferralOfUserStat(account, event.params.sizeDelta);
  _storeLeaderboard(account, event.block.timestamp.toI32(), event.params.sizeDelta.toBigDecimal().div(DECIMAL30), true);
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  const account = event.params.account.toHexString()
  // collateral delta
  {
    let collateralTokenPrice = getMinPriveV1(event.params.collateralToken.toHexString());
    const token = _loadOrStoreToken(event.params.collateralToken,event.address)
    const collateralDelta = event.params.collateralDelta.times(BigInt.fromI32(10).pow(token.vaultDecimals as u8)).div(collateralTokenPrice);
    collateralTokenPrice = collateralTokenPrice.div(BigInt.fromI32(10).pow(token.decimals as u8))
    saveCollateralPrice(event.params.collateralToken.toHexString(), collateralTokenPrice.toBigDecimal(), event.block.timestamp.toI32());
    storeUserCollateral(account, event.block.timestamp.toI32(), event.params.collateralToken.toHexString(), collateralDelta.neg());
  }
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

// FIXME: when swap is required
export function handleSwap(event: SwapEvent): void {
  // const marketPrice = getMarketTokenPriceV1(event.params.tokenIn.toHexString(), event.block.timestamp.toI32())
  // const token = _loadOrStoreToken(event.params.tokenIn);
  // const swapUSD = event.params.amountIn.toBigDecimal().times(marketPrice.toBigDecimal()).div(DECIMAL30).div(exponentToBigDecimal(token.decimals as i32));
  // _storeLeaderboardSwap(event.params.account.toHexString(), event.block.timestamp.toI32(), swapUSD);
}

function _loadOrStoreToken(tokenAddr: Address, vault: Address): Token {
  const id = tokenAddr.toHexString();
  let token = Token.load(id);
  if (!token) {
    const vaultContract = VaultContract.bind(vault);
    const tokenContract = ERC20Contract.bind(tokenAddr);
    let symbol = 'unkown';
    const symbolResult = tokenContract.try_symbol();
    if (!symbolResult.reverted) {
      symbol = symbolResult.value;
    }
    let name = 'unkown';
    const nameResult = tokenContract.try_name();
    if (!nameResult.reverted) {
      name = nameResult.value;
    }
    let decimals = 18;
    const decimalsResult = tokenContract.try_decimals();
    if (!decimalsResult.reverted) {
      decimals = decimalsResult.value;
    }
    let vaultDecimals = 18;
    const vaultDecimalsResult = vaultContract.try_tokenDecimals(tokenAddr);
    if (!vaultDecimalsResult.reverted) {
      vaultDecimals = vaultDecimalsResult.value.toI32();
    }

    token = new Token(id)
    token.symbol = symbol;
    token.name = name;
    token.decimals = decimals;
    token.vaultDecimals = vaultDecimals;
    token.save();
  }
  return token;
}

// store margin and tradingVolume
function _storeLeaderboard(account: string, timestamp: i32, sizeDelta: BigDecimal, isIncrease: boolean): void {
  ignoreOrCreateLeaderboardSnapOfPrevHour(account, timestamp);
  const leaderboard = loadOrCreateLeaderboard(account);
  if (isIncrease) {
    leaderboard.margin = leaderboard.margin.plus(sizeDelta);
  } else {
    leaderboard.margin = leaderboard.margin.minus(sizeDelta);
  }
  leaderboard.tradingVolume = leaderboard.tradingVolume.plus(sizeDelta);
  let referralCode = getReferralCode(account);
  if (referralCode != "") {
    let owner = getReferralCodeOwner(account, referralCode);
    if (owner != "") {
      ignoreOrCreateLeaderboardSnapOfPrevHour(owner, timestamp);
      const ownerLeaderboard = loadOrCreateLeaderboard(owner);
      ownerLeaderboard.referral = ownerLeaderboard.referral.plus(sizeDelta);
      ownerLeaderboard.latestUpdateTimestamp = timestamp;
      ownerLeaderboard.save();
    }
  }
  leaderboard.latestUpdateTimestamp = timestamp;
  leaderboard.save()
}

function _storeLeaderboardNetProfit(account: string, timestamp: i32, netProfit: BigDecimal): void {
  ignoreOrCreateLeaderboardSnapOfPrevHour(account, timestamp);
  const leaderboard = loadOrCreateLeaderboard(account);
  leaderboard.netProfit = leaderboard.netProfit.plus(netProfit);
  leaderboard.latestUpdateTimestamp = timestamp;
  leaderboard.save();
}

function _storeLeaderboardSwap(account: string, timestamp: i32, swap: BigDecimal): void {
  ignoreOrCreateLeaderboardSnapOfPrevHour(account, timestamp);
  const leaderboard = loadOrCreateLeaderboard(account);
  leaderboard.swap = leaderboard.swap.plus(swap);
  leaderboard.latestUpdateTimestamp = timestamp;
  leaderboard.save();
}