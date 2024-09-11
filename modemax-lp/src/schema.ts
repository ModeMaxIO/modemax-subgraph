import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Leaderboard, MarketToken, UserLiquidity, UserLiquiditySnap } from "../generated/schema";
import { BD_ZERO } from "./const";

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
    userLiquidity.basePoints = BD_ZERO;
    userLiquidity.latestUpdateTimestamp = 0;
    userLiquidity.save();

    // refer to leaderboard
    const leaderboard = Leaderboard.load(account);
    if (leaderboard) {
      leaderboard.liquidity = id;
    }
  }
  return userLiquidity;
}

export function createUserLiquiditySnap(account: string, timestamp: i32, lps: BigInt[], markets: string[], marketPrices: BigDecimal[], basePoints: BigDecimal): void {
  let id = account.
    concat(timestamp.toString());
  let snap = UserLiquiditySnap.load(id);
  let index = 0;
  for (;snap;) {
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
  snap.basePoints = basePoints;
  snap.save();
}