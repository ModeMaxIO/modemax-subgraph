import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Distribution, TokenPrice } from "../generated/schema";
import { BI_ZERO } from "./const";
import { loadOrCreateToken } from "./referral-distributor-helpers";

export function loadOrUpdateDistribution(
  hash: Bytes,
  blockNumber: BigInt,
  timestamp: BigInt,
  receiver: string,
  token: string,
  market: string | null,
  amount: BigInt,
  typeId: BigInt
): void {
  let id =
    receiver +
    ":" +
    hash.toHexString() +
    ":" +
    typeId.toString();
  let entity = Distribution.load(id);
  if (entity == null) {
    entity = new Distribution(id);
    entity.tokens = new Array<string>(0);
    entity.markets = new Array<string>(0);
    entity.amounts = new Array<BigInt>(0);
    entity.amountsInUsd = new Array<BigInt>(0);
  }
  let tokens = entity.tokens;
  tokens.push(token);
  entity.tokens = tokens;

  let amounts = entity.amounts;
  amounts.push(amount);
  entity.amounts = amounts;

  const tokenPrice = TokenPrice.load(token);
  
  if (tokenPrice) {
    const tokenEntity = loadOrCreateToken(token);
    let amountsInUsd = entity.amountsInUsd;
    amountsInUsd.push(tokenPrice.price.times(amount).times(BigInt.fromI32(10).pow((22 - tokenEntity.decimals) as u8)));
    entity.amountsInUsd = amountsInUsd;
  }

  if (market) {
    let markets = entity.markets;
    markets.push(market);
    entity.markets = markets;
  }

  entity.typeId = typeId;
  entity.receiver = receiver;

  entity.blockNumber = blockNumber;
  entity.transactionHash = hash.toHexString();
  entity.timestamp = timestamp;

  entity.save();
}