// import {
//   EventLog1 as EventLog1Event,
// } from "../generated/EventEmitter/EventEmitter"
import { Transfer as TransferEvent } from "../generated/templates/MarketTokenTemplate/MarketToken";
import { MarketTokenTemplate } from "../generated/templates";
import { Affiliate, AffiliateStat, AffiliateStatData, Distribution, GlobalStat, PositionReferralAction, ReferralCode, ReferralStat, ReferralStatData, ReferralVolumeRecord, Tier, TradedReferral, TraderToReferralCode } from "../generated/schema";
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { BASIS_POINTS_DIVISOR, ONE, Version, ZERO, ZERO_ADDRESS, ZERO_BYTES32 } from "./helpers/constant";
import { getAddressItem, getUintItem, timestampToPeriod } from "./utils/utils";
import { getOrCreateAffiliate, getOrCreateAffiliateStat, getOrCreateGlobalStat, getOrCreateTier } from "./helpers/schema-helpers";


// export function handleEventLog1(event: EventLog1Event): void {
//   let eventName = event.params.eventName;
//   // let eventData = new EventData(
//   //   event.params.eventData as EventLogEventDataStruct
//   // );

//   if (eventName == "MarketCreated") {
//     let marketToken = getAddressItem("marketToken", event.params.eventData)!
//     MarketTokenTemplate.create(marketToken);
//     return;
//   }

//   if (eventName == "PositionIncrease" || eventName == "PositionDecrease") {
//     let account = getAddressItem("account", event.params.eventData)!;
//     let sizeDelta = getUintItem("sizeInUsd", event.params.eventData);
//     let traderToReferralCode = TraderToReferralCode.load(account.toHexString());
//     if (traderToReferralCode == null) {
//       return;
//     }

//     let referralCode = traderToReferralCode.referralCode;
//     let referralCodeEntity = ReferralCode.load(referralCode);
//     let affiliate = referralCodeEntity!.owner;

//     _handlePositionAction(
//       event.block.number,
//       event.transaction.hash,
//       event.logIndex,
//       event.block.timestamp,
//       account,
//       sizeDelta,
//       referralCode.toString(),
//       Address.fromString(affiliate),
//       eventName == "PositionIncrease",
//       "v2"
//     );
//     return;
//   } else if (eventName == "AffiliateRewardClaimed") {
//     let typeId = BigInt.fromI32(1000);
//     _createOrUpdateDistribution(
//       event,
//       getAddressItem("affiliate", event.params.eventData)!.toHexString(),
//       getAddressItem("token", event.params.eventData)!.toHexString(),
//       getAddressItem("market", event.params.eventData)!.toHexString(),
//       getUintItem("amount", event.params.eventData),
//       typeId
//     );
//     return;
//   } else if (eventName == "SwapInfo") {
//     let account = getAddressItem("receiver", event.params.eventData)!;
//     let traderToReferralCode = TraderToReferralCode.load(account.toHexString());
//     if (traderToReferralCode == null) {
//       return;
//     }
//     let referralCode = traderToReferralCode.referralCode;
//     let referralCodeEntity = ReferralCode.load(referralCode);
//     let affiliate = referralCodeEntity!.owner;
//     _storeAffiliateStatsTotalSimple(
//       event.block.timestamp,
//       account,
//       referralCode.toString(),
//       Address.fromString(affiliate)
//     )
//   }
// }


// internal functions

function _handlePositionAction(
  blockNumber: BigInt,
  transactionHash: Bytes,
  eventLogIndex: BigInt,
  timestamp: BigInt,
  referral: Address,
  volume: BigInt,
  referralCode: string,
  affiliate: Address,
  isIncrease: boolean,
  version: Version
): void {
  let actionId = transactionHash.toHexString() + ":" + eventLogIndex.toString();
  let action = new PositionReferralAction(actionId);
  action.isIncrease = isIncrease;
  action.account = referral.toHexString();
  action.referralCode = referralCode;
  action.affiliate = affiliate.toHexString();
  action.transactionHash = transactionHash.toHexString();
  action.blockNumber = blockNumber.toI32();
  action.logIndex = eventLogIndex.toI32();
  action.timestamp = timestamp;
  action.volume = volume;
  action.save();

  if (referral.toHexString() == ZERO_ADDRESS || referralCode == ZERO_BYTES32) {
    return;
  }

  let affiliateEntity = getOrCreateAffiliate(affiliate.toHexString());
  let tierEntity = getOrCreateTier(affiliateEntity.tierId.toString());

  let id = transactionHash.toHexString() + ":" + eventLogIndex.toString();
  let entity = new ReferralVolumeRecord(id);

  entity.volume = volume;
  entity.referral = referral.toHexString();
  entity.referralCode = referralCode;
  entity.affiliate = affiliate.toHexString();
  entity.tierId = affiliateEntity.tierId;
  entity.marginFee = BigInt.fromI32(10);
  entity.totalRebate = tierEntity.totalRebate;
  entity.discountShare =
    affiliateEntity.discountShare > ZERO
      ? affiliateEntity.discountShare
      : tierEntity.discountShare;
  entity.blockNumber = blockNumber;
  entity.transactionHash = transactionHash.toHexString();
  entity.timestamp = timestamp;

  let feesUsd = entity.volume.times(entity.marginFee).div(BASIS_POINTS_DIVISOR);
  let totalRebateUsd = feesUsd
    .times(entity.totalRebate)
    .div(BASIS_POINTS_DIVISOR);
  let discountUsd = totalRebateUsd
    .times(entity.discountShare)
    .div(BASIS_POINTS_DIVISOR);

  entity.totalRebateUsd = totalRebateUsd;
  entity.discountUsd = discountUsd;

  entity.save();

  let totalAffiliateStatEntity = _storeAffiliateStats(
    timestamp,
    "total",
    volume,
    referralCode,
    affiliate,
    referral,
    totalRebateUsd,
    discountUsd,
    null,
    version
  );
  _storeAffiliateStats(
    timestamp,
    "daily",
    volume,
    referralCode,
    affiliate,
    referral,
    totalRebateUsd,
    discountUsd,
    totalAffiliateStatEntity,
    version
  );

  let totalReferralStatEntity = _storeReferralStats(
    timestamp,
    "total",
    referral,
    volume,
    discountUsd,
    null,
    version
  );
  _storeReferralStats(
    timestamp,
    "daily",
    referral,
    volume,
    discountUsd,
    totalReferralStatEntity,
    version
  );

  let totalGlobalStatEntity = _storeGlobalStats(
    timestamp,
    "total",
    volume,
    totalRebateUsd,
    discountUsd,
    null
  );
  _storeGlobalStats(
    timestamp,
    "daily",
    volume,
    totalRebateUsd,
    discountUsd,
    totalGlobalStatEntity
  );
}

function _createOrUpdateDistribution(
  event: ethereum.Event,
  receiver: string,
  token: string,
  market: string | null,
  amount: BigInt,
  typeId: BigInt
): void {
  let id =
    receiver +
    ":" +
    event.transaction.hash.toHexString() +
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

  let amountsInUsd = entity.amountsInUsd;
  // FIXME: chainlink price. see from loxodrome-referrals
  amountsInUsd.push(ZERO);
  entity.amountsInUsd = amountsInUsd;

  if (market) {
    let markets = entity.markets;
    markets.push(market);
    entity.markets = markets;
  }

  entity.typeId = typeId;
  entity.receiver = receiver;

  entity.blockNumber = event.block.number;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.timestamp = event.block.timestamp;

  entity.save();
}

function _storeAffiliateStatsTotalSimple(
  timestamp: BigInt,
  referral: Address,
  referralCode: string,
  affiliate: Address
): void {
  const period = 'total';
  let entity = getOrCreateAffiliateStat(
    timestamp,
    period,
    affiliate,
    referralCode
  );
  let isNewReferral = _createTradedReferralIfNotExist(entity.id, referral);

  if (isNewReferral) {
    entity.tradedReferralsCount = entity.tradedReferralsCount.plus(BigInt.fromI32(1));
  }
  entity.save();
}

function _createTradedReferralIfNotExist(
  affiliateStatId: string,
  referral: Address
): boolean {
  let id = affiliateStatId + ":" + referral.toHexString();
  let entity = TradedReferral.load(id);
  if (entity == null) {
    entity = new TradedReferral(id);
    entity.affiliateStat = affiliateStatId;
    entity.referral = referral.toHexString();
    entity.save();
    return true;
  }
  return false;
}

function _storeGlobalStats(
  timestamp: BigInt,
  period: string,
  volume: BigInt,
  totalRebateUsd: BigInt,
  discountUsd: BigInt,
  totalEntity: GlobalStat | null
): GlobalStat {
  let entity = getOrCreateGlobalStat(timestamp, period, totalEntity);

  entity.volume = entity.volume.plus(volume);
  entity.totalRebateUsd = entity.totalRebateUsd.plus(totalRebateUsd);
  entity.discountUsd = entity.discountUsd.plus(discountUsd);
  entity.trades = entity.trades.plus(BigInt.fromI32(1));

  if (period == "total") {
    totalEntity = entity;
  }

  if (totalEntity) {
    entity.volumeCumulative = totalEntity.volume;
    entity.totalRebateUsdCumulative = totalEntity.totalRebateUsd;
    entity.discountUsdCumulative = totalEntity.discountUsd;
    entity.tradesCumulative = totalEntity.trades;
    entity.affiliatesCountCumulative = totalEntity.affiliatesCount;
    entity.referralCodesCountCumulative = totalEntity.referralCodesCount;
  }

  entity.save();

  return entity as GlobalStat;
}




function _storeAffiliateStats(
  timestamp: BigInt,
  period: string,
  volume: BigInt,
  referralCode: string,
  affiliate: Address,
  referral: Address,
  totalRebateUsd: BigInt,
  discountUsd: BigInt,
  totalEntity: AffiliateStat | null,
  version: Version
): AffiliateStat {
  let entity = getOrCreateAffiliateStat(
    timestamp,
    period,
    affiliate,
    referralCode
  );
  // is traded or swapped or addedLp
  let isNewReferral = _createTradedReferralIfNotExist(entity.id, referral);

  if (isNewReferral) {
    entity.tradedReferralsCount = entity.tradedReferralsCount.plus(BigInt.fromI32(1));
  }

  entity.volume = entity.volume.plus(volume);
  entity.trades = entity.trades.plus(ONE);
  entity.totalRebateUsd = entity.totalRebateUsd.plus(totalRebateUsd);
  entity.discountUsd = entity.discountUsd.plus(discountUsd);

  let entityData = _getAffiliateStatData(entity.id, version);
  entityData.volume = entityData.volume.plus(volume);
  entityData.trades = entityData.trades.plus(ONE);
  entityData.totalRebateUsd = entityData.totalRebateUsd.plus(totalRebateUsd);
  entityData.discountUsd = entityData.discountUsd.plus(discountUsd);

  if (period == "total") {
    entity.volumeCumulative = entity.volume;
    entity.totalRebateUsdCumulative = entity.totalRebateUsd;
    entity.discountUsdCumulative = entity.discountUsd;
    entity.tradesCumulative = entity.trades;
    entity.tradedReferralsCountCumulative = entity.tradedReferralsCount;

    entityData.volumeCumulative = entityData.volume;
    entityData.totalRebateUsdCumulative = entityData.totalRebateUsd;
    entityData.discountUsdCumulative = entityData.discountUsd;
    entityData.tradesCumulative = entityData.trades;
  } else {
    entity.volumeCumulative = totalEntity!.volumeCumulative;
    entity.tradesCumulative = totalEntity!.tradesCumulative;
    entity.totalRebateUsdCumulative = totalEntity!.totalRebateUsdCumulative;
    entity.discountUsdCumulative = totalEntity!.discountUsdCumulative;
    entity.tradedReferralsCountCumulative = totalEntity!.tradedReferralsCount;

    let totalEntityData = _getAffiliateStatData(totalEntity!.id, version);
    entityData.volumeCumulative = totalEntityData.volumeCumulative;
    entityData.tradesCumulative = totalEntityData.tradesCumulative;
    entityData.totalRebateUsdCumulative =
      totalEntityData.totalRebateUsdCumulative;
    entityData.discountUsdCumulative = totalEntityData.discountUsdCumulative;
  }

  entityData.save();
  entity.save();

  return entity as AffiliateStat;
}

function _getAffiliateStatData(
  affiliateStatId: string,
  version: Version
): AffiliateStatData {
  let id = affiliateStatId + ":" + version;
  let entity = AffiliateStatData.load(id);
  return entity as AffiliateStatData;
}

function _storeReferralStats(
  timestamp: BigInt,
  period: string,
  referral: Address,
  volume: BigInt,
  discountUsd: BigInt,
  totalEntity: ReferralStat | null,
  version: Version
): ReferralStat {
  let periodTimestamp = timestampToPeriod(timestamp, period);
  let id =
    period + ":" + periodTimestamp.toString() + ":" + referral.toHexString();

  let entity = ReferralStat.load(id);
  let v1Data: ReferralStatData | null = null;
  let v2Data: ReferralStatData | null = null;
  if (entity === null) {
    entity = new ReferralStat(id);
    entity.referral = referral.toHexString();
    entity.volume = ZERO;
    entity.volumeCumulative = ZERO;
    entity.discountUsd = ZERO;
    entity.discountUsdCumulative = ZERO;
    entity.timestamp = periodTimestamp;
    entity.period = period;

    v1Data = _createReferralStatData(id, "v1");
    entity.v1Data = v1Data.id;

    v2Data = _createReferralStatData(id, "v2");
    entity.v2Data = v2Data.id;
  } else {
    v1Data = _getReferralStatData(id, "v1");
    v2Data = _getReferralStatData(id, "v2");
  }

  entity.volume = entity.volume.plus(volume);
  entity.discountUsd = entity.discountUsd.plus(discountUsd);

  let entityData = version == "v1" ? v1Data : v2Data;
  entityData.volume = entityData.volume.plus(volume);
  entityData.discountUsd = entityData.discountUsd.plus(discountUsd);

  if (period == "total") {
    totalEntity = entity;
  }
  entity.volumeCumulative = totalEntity!.volume;
  entity.discountUsdCumulative = totalEntity!.discountUsd;

  let totalEntityData = _getReferralStatData(totalEntity!.id, version);
  entityData.volumeCumulative = totalEntityData.volume;
  entityData.discountUsdCumulative = totalEntityData.discountUsd;

  entity.save();
  entityData.save();

  return entity as ReferralStat;
}

function _createReferralStatData(
  affiliateStatId: string,
  version: Version
): ReferralStatData {
  let id = affiliateStatId + ":" + version;
  let entity = new ReferralStatData(id);
  entity.volume = ZERO;
  entity.volumeCumulative = ZERO;
  entity.discountUsd = ZERO;
  entity.discountUsdCumulative = ZERO;

  entity.save();
  return entity;
}

function _getReferralStatData(
  referralStatId: string,
  version: Version
): ReferralStatData {
  let id = referralStatId + ":" + version;
  let entity = ReferralStatData.load(id);
  return entity as ReferralStatData;
}

export function handleMarketTokenTransfer(event: TransferEvent): void {
  let from = event.params.from.toHexString();
  let to = event.params.to.toHexString();
  let value = event.params.value;
  // from != ZERO_ADDRESS -> remove; to != ZERO_ADDRESS -> add
  if (from != ZERO_ADDRESS || to != ZERO_ADDRESS) {

    let account = from;
    if (to != ZERO_ADDRESS) {
      account = to;
    }
    let traderToReferralCode = TraderToReferralCode.load(account);
    if (traderToReferralCode == null) {
      return;
    }
    let referralCode = traderToReferralCode.referralCode;
    let referralCodeEntity = ReferralCode.load(referralCode);
    let affiliate = referralCodeEntity!.owner;

    _storeAffiliateStatsTotalSimple(
      event.block.timestamp,
      Address.fromString(account),
      referralCode,
      Address.fromString(affiliate)
    )
  }
}