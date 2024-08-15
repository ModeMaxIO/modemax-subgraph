import { BigDecimal } from "@graphprotocol/graph-ts";
import { Pair, Token, TokenPrice } from "../../generated/schema";
import { BD_ONE, BD_ZERO, MINIMUM_LIQUIDITY_THRESHOLD_USD, USD_ANCHOR } from "./const";

export function saveTokenPrice(token: Token, pairId: string): void {
  let tokenPrice = TokenPrice.load(token.id);
  if (!tokenPrice) {
    tokenPrice = new TokenPrice(token.id);
    if (tokenPrice.id == USD_ANCHOR.toHexString()) {
      tokenPrice.priceUSD = BD_ONE;
    } else {
      tokenPrice.priceUSD = BD_ZERO;
    }
    tokenPrice.save();
  }
  if (token.id == USD_ANCHOR.toHexString()) {
     // always one
    return;
  }
  let pair = Pair.load(pairId);
  if (pair) {
    let token0Price = BD_ZERO;
    if (pair.reserve1.notEqual(BD_ZERO)) {
      token0Price = pair.reserve0.div(pair.reserve1);
    }
    let token1Price = BD_ZERO;
    if (pair.reserve0.notEqual(BD_ZERO)) {
      token1Price = pair.reserve1.div(pair.reserve0);
    }
    let priceUSD = tokenPrice.priceUSD;
    if (pair.token0 == token.id) {
      const token1 = Token.load(pair.token1);
      if (token1) {
        priceUSD = token1Price.times(token1.derivedUSD);
      }
    } else if (pair.token1 == token.id) {
      const token0 = Token.load(pair.token0);
      if (token0) {
        priceUSD = token0Price.times(token0.derivedUSD);
      }
    }
    if (priceUSD.notEqual(tokenPrice.priceUSD) && pair.reserveUSD.gt(MINIMUM_LIQUIDITY_THRESHOLD_USD)) {
      tokenPrice.priceUSD = priceUSD;
      tokenPrice.save();
    }
  }
}

export function findUSDPerToken(token: Token): BigDecimal {
  if (token.id == USD_ANCHOR.toHexString()) {
    return BD_ONE
  }
  const tokenPrice = TokenPrice.load(token.id);
  if (tokenPrice) {
    return tokenPrice.priceUSD;
  }
  return BD_ZERO;
}