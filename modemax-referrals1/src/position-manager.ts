import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { DecreasePositionReferral, IncreasePositionReferral } from "../generated/PositionManager/PositionManager";
import { Affiliate, AffiliateStat, AffiliateStatData, ExecuteDecreaseOrder, GlobalStat, PositionReferralAction, ReferralStat, ReferralStatData, ReferralVolumeRecord, Tier, TradedReferral } from "../generated/schema";
import { BASIS_POINTS_DIVISOR, Version, ZERO_ADDRESS } from "./helpers/constant";
import { BI_ONE, BI_ZERO } from "./const";

export function handleIncreasePositionReferral(
  event: IncreasePositionReferral
): void {
  _handlePositionAction(
    event.block.number,
    event.transaction.hash,
    event.logIndex,
    event.block.timestamp,
    event.params.account,
    event.params.sizeDelta,
    event.params.referralCode.toHex(),
    event.params.referrer,
    true,
    "v1"
  );
}

export function handleDecreasePositionReferral(
  event: DecreasePositionReferral
): void {
  let sizeDelta = event.params.sizeDelta;
  if (sizeDelta == BI_ZERO) {
    // sizeDelta is incorrectly emitted for decrease orders
    let prevLogIndex = event.logIndex = event.logIndex.minus(BI_ONE);
    let executeDecreaseOrderId =
      event.transaction.hash.toHexString() + ":" + prevLogIndex.toString();
    let executeDecreaseOrderEntity = ExecuteDecreaseOrder.load(
      executeDecreaseOrderId
    );
    if (executeDecreaseOrderEntity != null) {
      sizeDelta = executeDecreaseOrderEntity.sizeDelta;
    }
  }

  _handlePositionAction(
    event.block.number,
    event.transaction.hash,
    event.logIndex,
    event.block.timestamp,
    event.params.account,
    sizeDelta,
    event.params.referralCode.toHex(),
    event.params.referrer,
    false,
    "v1"
  );
}


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

  if (referral.toHexString() == ZERO_ADDRESS || referralCode == ZERO_ADDRESS) {
    return;
  }

  let affiliateEntity = _getOrCreateAffiliate(affiliate.toHexString());
  let tierEntity = _getOrCreateTier(affiliateEntity.tierId.toString());

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
    affiliateEntity.discountShare > BI_ZERO
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

function _getOrCreateAffiliate(id: string): Affiliate {
  let entity = Affiliate.load(id);
  if (entity == null) {
    entity = new Affiliate(id);
    entity.tierId = BI_ZERO;
    entity.discountShare = BI_ZERO;
    entity.save();
  }
  return entity as Affiliate;
}

function _getOrCreateTier(id: string): Tier {
  let entity = Tier.load(id);
  if (entity == null) {
    entity = new Tier(id);
    // default values for tier 0
    entity.totalRebate = BigInt.fromI32(1000);
    entity.discountShare = BigInt.fromI32(5000);
    entity.save();
  }
  return entity as Tier;
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
  let entity = _getOrCreateAffiliateStat(
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
  entity.trades = entity.trades.plus(BI_ONE);
  entity.totalRebateUsd = entity.totalRebateUsd.plus(totalRebateUsd);
  entity.discountUsd = entity.discountUsd.plus(discountUsd);

  let entityData = _getAffiliateStatData(entity.id, version);
  entityData.volume = entityData.volume.plus(volume);
  entityData.trades = entityData.trades.plus(BI_ONE);
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

function _getOrCreateAffiliateStat(
  timestamp: BigInt,
  period: string,
  affiliate: Address,
  referralCode: string
): AffiliateStat {
  let periodTimestamp = timestampToPeriod(timestamp, period);
  let id =
    period +
    ":" +
    periodTimestamp.toString() +
    ":" +
    referralCode +
    ":" +
    affiliate.toHexString();

  let entity = AffiliateStat.load(id);
  if (entity === null) {
    entity = new AffiliateStat(id);
    entity.volume = BI_ZERO;
    entity.volumeCumulative = BI_ZERO;
    entity.trades = BI_ZERO;
    entity.tradesCumulative = BI_ZERO;
    entity.tradedReferralsCount = BI_ZERO;
    entity.tradedReferralsCountCumulative = BI_ZERO;
    entity.registeredReferralsCount = BI_ZERO;
    entity.registeredReferralsCountCumulative = BI_ZERO;

    entity.totalRebateUsd = BI_ZERO;
    entity.totalRebateUsdCumulative = BI_ZERO;
    entity.discountUsd = BI_ZERO;
    entity.discountUsdCumulative = BI_ZERO;

    entity.timestamp = periodTimestamp;
    entity.affiliate = affiliate.toHexString();
    entity.referralCode = referralCode;
    entity.period = period;

    let v1Data = _createAffiliateStatData(id, "v1");
    entity.v1Data = v1Data.id;

    let v2Data = _createAffiliateStatData(id, "v2");
    entity.v2Data = v2Data.id;
  }
  return entity as AffiliateStat;
}

export function timestampToPeriod(timestamp: BigInt, period: String): BigInt {
  if (period === "total") {
    return BigInt.fromI32(0)
  }
  let delimeter: BigInt = BI_ONE;
  if (period === "daily") delimeter = BigInt.fromI32(86400)
  else if (period === "weekly") delimeter = BigInt.fromI32(86400 * 7)
  else if (period === "hourly") delimeter = BigInt.fromI32(3600)
  return timestamp.div(delimeter).times(delimeter)
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
    entity.volume = BI_ZERO;
    entity.volumeCumulative = BI_ZERO;
    entity.discountUsd = BI_ZERO;
    entity.discountUsdCumulative = BI_ZERO;
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
  entity.volume = BI_ZERO;
  entity.volumeCumulative = BI_ZERO;
  entity.discountUsd = BI_ZERO;
  entity.discountUsdCumulative = BI_ZERO;

  entity.save();
  return entity;
}

function _storeGlobalStats(
  timestamp: BigInt,
  period: string,
  volume: BigInt,
  totalRebateUsd: BigInt,
  discountUsd: BigInt,
  totalEntity: GlobalStat | null
): GlobalStat {
  let entity = _getOrCreateGlobalStat(timestamp, period, totalEntity);

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

function _getOrCreateGlobalStat(
  timestamp: BigInt,
  period: string,
  totalEntity: GlobalStat | null
): GlobalStat {
  let periodTimestamp = timestampToPeriod(timestamp, period);
  let id = period + ":" + periodTimestamp.toString();

  let entity = GlobalStat.load(id);
  if (entity == null) {
    entity = new GlobalStat(id);
    entity.volume = BI_ZERO;
    entity.volumeCumulative = BI_ZERO;
    entity.totalRebateUsd = BI_ZERO;
    entity.totalRebateUsdCumulative = BI_ZERO;
    entity.discountUsd = BI_ZERO;
    entity.discountUsdCumulative = BI_ZERO;
    entity.trades = BI_ZERO;
    entity.tradesCumulative = BI_ZERO;

    entity.referralCodesCount = BI_ZERO;
    entity.referralCodesCountCumulative = BI_ZERO;

    entity.affiliatesCount = BI_ZERO;
    entity.affiliatesCountCumulative = BI_ZERO;

    entity.referralsCount = BI_ZERO;
    entity.referralsCountCumulative = BI_ZERO;

    if (totalEntity) {
      entity.affiliatesCountCumulative = totalEntity.affiliatesCount;
      entity.referralCodesCountCumulative =
        totalEntity.referralCodesCountCumulative;
      entity.volumeCumulative = totalEntity.volumeCumulative;
      entity.totalRebateUsdCumulative = totalEntity.totalRebateUsdCumulative;
      entity.discountUsdCumulative = totalEntity.discountUsdCumulative;
      entity.referralsCountCumulative = totalEntity.referralsCountCumulative;
    }

    entity.period = period;
    entity.timestamp = periodTimestamp;
  }
  return entity as GlobalStat;
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

function _getAffiliateStatData(
  affiliateStatId: string,
  version: Version
): AffiliateStatData {
  let id = affiliateStatId + ":" + version;
  let entity = AffiliateStatData.load(id);
  return entity as AffiliateStatData;
}

function _createAffiliateStatData(
  affiliateStatId: string,
  version: Version
): AffiliateStatData {
  let id = affiliateStatId + ":" + version;
  let entity = new AffiliateStatData(id);
  entity.volume = BI_ZERO;
  entity.volumeCumulative = BI_ZERO;
  entity.totalRebateUsd = BI_ZERO;
  entity.totalRebateUsdCumulative = BI_ZERO;
  entity.discountUsd = BI_ZERO;
  entity.discountUsdCumulative = BI_ZERO;
  entity.trades = BI_ZERO;
  entity.tradesCumulative = BI_ZERO;

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