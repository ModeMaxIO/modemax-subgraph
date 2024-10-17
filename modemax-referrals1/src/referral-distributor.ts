import {
  ClaimRewards as ClaimRewardsEvent,
  DepositTokens as DepositTokensEvent,
  DistributeRewards as DistributeRewardsEvent,
  DistributePrices as DistributePricesEvent
} from "../generated/ReferralDistributor/ReferralDistributor";
import { TokenPrice } from "../generated/schema";
import { loadOrUpdateDistribution } from "./schema-helpers";

export function handleClaimRewards(event: ClaimRewardsEvent): void {
  // let typeId = event.params.typeId;
  // let receiver = event.params.account.toHexString();
  // for(let i = 0; i < event.params.tokens.length; i++){
  //   loadOrUpdateDistribution(
  //     event.transaction.hash,
  //     event.block.number,
  //     event.block.timestamp,
  //     receiver,
  //     event.params.tokens[i].toHexString(),
  //     null,
  //     event.params.amounts[i],
  //     typeId
  //   );
  // }
}
export function handleDepositTokens(event: DepositTokensEvent): void {
  
}
export function handleDistributeRewards(event: DistributeRewardsEvent): void {
  let typeId = event.params.typeId;
  let receiver = event.params.account.toHexString();
  for(let i = 0; i < event.params.tokens.length; i++){
    loadOrUpdateDistribution(
      event.transaction.hash,
      event.block.number,
      event.block.timestamp,
      receiver,
      event.params.tokens[i].toHexString(),
      null,
      event.params.amounts[i],
      typeId
    );
  }
}
export function handleDistributePrices(event: DistributePricesEvent): void {
  const tokens = event.params.tokens;
  const prices = event.params.prices;

  for (let i = 0; i < tokens.length; i++) {
    const id = tokens[i].toHexString();
    let tokenPrice = TokenPrice.load(id);
    if (!tokenPrice) {
      tokenPrice = new TokenPrice(id);
    }
    tokenPrice.price = prices[i];
    tokenPrice.timestamp = event.block.timestamp.toI32();
    tokenPrice.save();
  }
}