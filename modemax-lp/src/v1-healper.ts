import { Address, BigInt } from "@graphprotocol/graph-ts";
import { MarketPriceSnap } from "../generated/schema";
import { Vault as VaultContract } from "../generated/Vault/Vault";
import { BI_ZERO } from "./const";
import { loadOrCreateMarketTokenPrice, loadVault } from "./schema-helper";

export function getMarketTokenPriceV1(market: string, timestamp: i32): BigInt {
  const marketPriceSnapId = market.concat(':').concat(timestamp.toString());
  let marketPriceSnap = MarketPriceSnap.load(marketPriceSnapId);
  if (marketPriceSnap) {
    return marketPriceSnap.price;
  }
  if (timestamp == 0) {
    const marketPrice = loadOrCreateMarketTokenPrice(market);
    if (marketPrice.price.gt(BI_ZERO)) {
      return marketPrice.price;
    }
  }
  const entity = loadVault();
  if (!entity) {
    return BI_ZERO;
  }
  const vault = VaultContract.bind(Address.fromBytes(entity.address));
  const maxResult = vault.try_getMaxPrice(Address.fromString(market));
  if (maxResult.reverted) {
    return BI_ZERO;
  }
  const minResult = vault.try_getMinPrice(Address.fromString(market));
  if (minResult.reverted) {
    return BI_ZERO;
  }
  marketPriceSnap = new MarketPriceSnap(marketPriceSnapId);
  marketPriceSnap.price = maxResult.value.plus(minResult.value).div(BigInt.fromI32(2));
  marketPriceSnap.timestamp = timestamp;
  marketPriceSnap.save();
  const marketPrice = loadOrCreateMarketTokenPrice(market);
  marketPrice.price = marketPriceSnap.price;
  marketPrice.timestamp = timestamp;
  marketPrice.save();
  return marketPrice.price;
}