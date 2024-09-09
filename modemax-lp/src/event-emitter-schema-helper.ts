import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CollateralPrice, Leaderboard, LeaderboardSnap, MarketPrice, TokenPrice, UserCollateral, UserLiquidity, UserStat, UserTradeSnap } from "../generated/schema";
import { BD_ZERO, BI_ZERO, DECIMAL18, DECIMAL30 } from "./const";
import { getDayStartTimestamp } from "./helpers";
export function loadOrCreateUserStat(account: string): UserStat {
  const id = account;
  let userStat = UserStat.load(id);
  if (!userStat) {
    userStat = new UserStat(id);
    userStat.lp = BD_ZERO;
    userStat.trade = BD_ZERO;
    userStat.referral = BD_ZERO;
    userStat.swap = BD_ZERO;
    userStat.save();
  }
  return userStat;
}

export function createUserTradeSnap(account: string, hash: string, logIndex: BigInt, timestamp: BigInt, trade: BigDecimal): void {
  const id = account.concat(':').concat(hash).concat(':').concat(logIndex.toString());
  let snap = UserTradeSnap.load(id);
  if (!snap) {
    snap = new UserTradeSnap(id);
    snap.account = account;
    snap.timestamp = timestamp.toI32();
    snap.trade = trade;
    snap.save();
  }
}

export function loadOrCreateTokenPrice(tokenAddress: string): TokenPrice {
  let tokenPrice = TokenPrice.load(tokenAddress);
  if (!tokenPrice) {
    tokenPrice = new TokenPrice(tokenAddress);
    tokenPrice.minPrice = BI_ZERO;
    tokenPrice.maxPrice = BI_ZERO;
    tokenPrice.save();
  }
  return tokenPrice;
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

export function loadOrCreateLeaderboard(account: string): Leaderboard {
  let leaderboard = Leaderboard.load(account);
  if (!leaderboard) {
    leaderboard = new Leaderboard(account);
    leaderboard.account = account;
    leaderboard.margin = BD_ZERO;
    leaderboard.netProfit = BD_ZERO;
    leaderboard.tradingVolume = BD_ZERO;
    leaderboard.liquidity = account;
    leaderboard.collateral = account;
    leaderboard.latestUpdateTimestamp = 0;
    leaderboard.save();
  }
  return leaderboard;
}


export function ignoreOrCreateLeaderboardSnapOfPrevDay(account: string, newTimestamp: i32): void {
  const leaderboard = loadOrCreateLeaderboard(account);
  if (leaderboard.latestUpdateTimestamp == 0) {
    return;
  }

  const newTime = getDayStartTimestamp(newTimestamp);
  const currTime = getDayStartTimestamp(leaderboard.latestUpdateTimestamp);
  if (currTime == newTime) {
    return;
  }
  const currSnapId = account.concat(':').concat(currTime.toString());
  let snap = LeaderboardSnap.load(currSnapId)
  if (snap) {
    return;
  }
  snap = new LeaderboardSnap(currSnapId)
  snap.account = leaderboard.account;
  snap.margin = leaderboard.margin;
  snap.netProfit = leaderboard.netProfit;
  snap.tradingVolume = leaderboard.tradingVolume;
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
    }
  }

  snap.save();
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