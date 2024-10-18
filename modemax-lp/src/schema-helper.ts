import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { loadOrCreateUserStat } from "./event-emitter-schema-helper";
import { getReferralCode, getReferralCodeOwner } from "./referral-storage-schema-helper";
import { BD_ZERO, BI_ZERO, C_DATA_STORE, C_STAKED_TOKEN, C_SYNTHETICS_READER, C_VAULT, DECIMAL18, DECIMAL30, ZeroAddress } from "./const";
import { CollateralPrice, ContractBundle, Leaderboard, LeaderboardSnap, MarketPrice, MarketToken, UserCollateral, UserLiquidity, UserLiquiditySnap } from "../generated/schema";
import { getHourStartTimestamp } from "./helpers";

export function storeReferralOfUserStat(account: string, sizeDelta: BigInt): void {
  let referralCode = getReferralCode(account);
  if (referralCode != "") {
    let owner = getReferralCodeOwner(account, referralCode);
    if (owner != "") {
      const userStat = loadOrCreateUserStat(owner);
      userStat.referral = userStat.referral.plus(sizeDelta.toBigDecimal().div(DECIMAL30));
      userStat.save();
    }
  }
}

export function createStakedTokenBundle(address: Bytes): ContractBundle {
  const id = C_STAKED_TOKEN;
  let b = ContractBundle.load(id);
  if (!b) {
    b = new ContractBundle(id);
    b.address = address;
    b.save();
  }
  return b;
}

export function loadStakedToken(): ContractBundle | null {
  return ContractBundle.load(C_STAKED_TOKEN);
}

export function createSyntheticsReader(address: Bytes): ContractBundle {
  const id = C_SYNTHETICS_READER;
  let b = ContractBundle.load(id);
  if (!b) {
    b = new ContractBundle(id);
    b.address = address;
    b.save();
  }
  return b;
}

export function loadSyntheticsReader(): ContractBundle | null {
  return ContractBundle.load(C_SYNTHETICS_READER);
}

export function createDataStore(address: Bytes): ContractBundle {
  const id = C_DATA_STORE;
  let b = ContractBundle.load(id);
  if (!b) {
    b = new ContractBundle(id);
    b.address = address;
    b.save();
  }
  return b;
}

export function loadDataStore(): ContractBundle | null {
  return ContractBundle.load(C_DATA_STORE);
}
export function createVault(address: Bytes): ContractBundle {
  const id = C_VAULT;
  let b = ContractBundle.load(id);
  if (!b) {
    b = new ContractBundle(id);
    b.address = address;
    b.save();
  }
  return b;
}

export function loadVault(): ContractBundle | null {
  return ContractBundle.load(C_VAULT);
}

export function loadOrCreateMarketToken(address: Address, indexToken: string, longToken: string, shortToken: string): MarketToken {
  const id = address.toHexString();
  let marketToken = MarketToken.load(id);
  if (!marketToken) {
    marketToken = new MarketToken(id);
    marketToken.indexToken = indexToken;
    marketToken.longToken = longToken;
    marketToken.shortToken = shortToken;
    marketToken.save();
  }
  return marketToken;
}

export function loadOrCreateUserLiquidity(account: string): UserLiquidity {
  const id = account;
  let userLiquidity = UserLiquidity.load(id);
  if (!userLiquidity) {
    userLiquidity = new UserLiquidity(id);
    userLiquidity.lps = [];
    userLiquidity.markets = [];
    userLiquidity.marketPrices = [];
    userLiquidity.ver = [];
    userLiquidity.basePoints = BD_ZERO;
    userLiquidity.latestUpdateTimestamp = 0;
    userLiquidity.save();
  }
  return userLiquidity;
}

export function createUserLiquiditySnap(account: string, timestamp: i32, lps: BigInt[], markets: string[], marketPrices: BigDecimal[], ver: i32[], basePoints: BigDecimal): void {
  let id = account.
    concat(timestamp.toString());
  let snap = UserLiquiditySnap.load(id);
  let index = 0;
  for (; snap;) {
    snap = UserLiquiditySnap.load(id.concat('-').concat(index.toString()));
    index++;
  }
  if (index > 0) {
    id = id.concat('-').concat(index.toString());
  }
  snap = new UserLiquiditySnap(id);
  snap.account = account;
  snap.timestamp = timestamp;
  snap.lps = lps;
  snap.markets = markets;
  snap.marketPrices = marketPrices;
  snap.ver = ver;
  snap.basePoints = basePoints;
  snap.save();
}

export function loadOrCreateUserCollateral(account: string): UserCollateral {
  let id = account;
  let collateral = UserCollateral.load(id);
  if (!collateral) {
    collateral = new UserCollateral(id);
    collateral.collaterals = [];
    collateral.collateralTokens = [];
    collateral.latestUpdateTimestamp = 0;
    collateral.save();
  }
  return collateral;
}


export function storeUserCollateral(account: string, timestamp: i32, targetCollateralToken: string, value: BigInt): void {
  const collateral = loadOrCreateUserCollateral(account);
  const collateralAmount = value.toBigDecimal()
  let foundTarget = false;
  const collaterals = collateral.collaterals;
  for (let i = 0; i < collateral.collateralTokens.length; i++) {
    const token = collateral.collateralTokens[i];
    if (token == targetCollateralToken) {
      foundTarget = true
      collaterals[i] = collaterals[i].plus(collateralAmount);
    }
  }
  collateral.latestUpdateTimestamp = timestamp;
  if (!foundTarget) {
    collaterals.push(collateralAmount);
    const tokens = collateral.collateralTokens;
    tokens.push(targetCollateralToken);
    collateral.collateralTokens = tokens;
  }
  collateral.collaterals = collaterals;
  collateral.save();
}

export function loadOrCreateLeaderboard(account: string): Leaderboard {
  let leaderboard = Leaderboard.load(account);
  if (!leaderboard) {
    leaderboard = new Leaderboard(account);
    leaderboard.margin = BD_ZERO;
    leaderboard.netProfit = BD_ZERO;
    leaderboard.tradingVolume = BD_ZERO;
    leaderboard.latestUpdateTimestamp = 0;
    leaderboard.swap = BD_ZERO;
    leaderboard.referral = BD_ZERO;
    loadOrCreateUserLiquidity(account);
    leaderboard.liquidity = account;
    loadOrCreateUserCollateral(account);
    leaderboard.collateral = account;

    leaderboard.save();
  }
  return leaderboard;
}


export function ignoreOrCreateLeaderboardSnapOfPrevHour(account: string, newTimestamp: i32): void {
  const leaderboard = loadOrCreateLeaderboard(account);
  if (leaderboard.latestUpdateTimestamp == 0) {
    return;
  }

  const newTime = getHourStartTimestamp(newTimestamp);
  const currTime = getHourStartTimestamp(leaderboard.latestUpdateTimestamp);
  if (currTime == newTime) {
    return;
  }
  const currSnapId = account.concat(':').concat(currTime.toString());
  let snap = LeaderboardSnap.load(currSnapId)
  if (snap) {
    return;
  }
  snap = new LeaderboardSnap(currSnapId)
  snap.account = leaderboard.id;
  snap.margin = leaderboard.margin;
  snap.netProfit = leaderboard.netProfit;
  snap.tradingVolume = leaderboard.tradingVolume;
  snap.swap = leaderboard.swap;
  snap.referral = leaderboard.referral;
  snap.timestamp = currTime;
  {
    const userLiquidity = UserLiquidity.load(account);
    if (userLiquidity) {
      let usd = BD_ZERO;
      for (let i = 0; i < userLiquidity.markets.length; i++) {
        const market = userLiquidity.markets[i];
        const prevPrice = userLiquidity.marketPrices[i];
        const lp = userLiquidity.lps[i];
        let midPrice = BD_ZERO;
        const nowPrice = MarketPrice.load(market);
        if (!nowPrice) {
          midPrice = prevPrice;
        } else {
          midPrice = prevPrice.plus(nowPrice.price.toBigDecimal().div(DECIMAL30)).div(BigDecimal.fromString('2'));
        }
        usd = usd.plus(lp.toBigDecimal().div(DECIMAL18))
      }
      snap.lpUsd = usd;
    } else {
      snap.lpUsd = BD_ZERO;
    }
  }
  {
    const userCollateral = UserCollateral.load(account);
    if (userCollateral) {
      let usd = BD_ZERO;
      for (let i = 0; i < userCollateral.collateralTokens.length; i++) {
        const token = userCollateral.collateralTokens[i];
        const amount = userCollateral.collaterals[i];
        const price = CollateralPrice.load(token);
        if (!price) {
          continue
        }
        usd = usd.plus(amount.times(price.price));
      }
      snap.collateralUsd = usd;
    } else {
      snap.collateralUsd = BD_ZERO;
    }
  }

  snap.save();
}

export function loadOrCreateMarketTokenPrice(market: string): MarketPrice {
  let id = market;
  let marketPrice = MarketPrice.load(id);
  if (!marketPrice) {
    marketPrice = new MarketPrice(id);
    marketPrice.price = BI_ZERO;
    marketPrice.timestamp = 0;
    marketPrice.save();
  }
  return marketPrice;
}

export function saveCollateralPrice(token: string, price: BigDecimal, timestamp: i32): void {
  let collateralPrice = CollateralPrice.load(token);
  if (!collateralPrice) {
    collateralPrice = new CollateralPrice(token);
  }
  collateralPrice.price = price;
  collateralPrice.timestamp = timestamp;
  collateralPrice.save();
}