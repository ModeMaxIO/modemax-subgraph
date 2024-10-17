import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Affiliate, AffiliateStat, AffiliateStatData, GlobalStat, Tier } from "../../generated/schema";
import { Version, ZERO } from "./constant";
import { timestampToPeriod } from "../utils/utils";

export function getOrCreateAffiliate(id: string): Affiliate {
  let entity = Affiliate.load(id);
  if (entity == null) {
    entity = new Affiliate(id);
    entity.tierId = ZERO;
    entity.discountShare = ZERO;
    entity.save();
  }
  return entity as Affiliate;
}

export function getOrCreateTier(id: string): Tier {
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

export function getOrCreateGlobalStat(
  timestamp: BigInt,
  period: string,
  totalEntity: GlobalStat | null
): GlobalStat {
  let periodTimestamp = timestampToPeriod(timestamp, period);
  let id = period + ":" + periodTimestamp.toString();

  let entity = GlobalStat.load(id);
  if (entity == null) {
    entity = new GlobalStat(id);
    entity.volume = ZERO;
    entity.volumeCumulative = ZERO;
    entity.totalRebateUsd = ZERO;
    entity.totalRebateUsdCumulative = ZERO;
    entity.discountUsd = ZERO;
    entity.discountUsdCumulative = ZERO;
    entity.trades = ZERO;
    entity.tradesCumulative = ZERO;

    entity.referralCodesCount = ZERO;
    entity.referralCodesCountCumulative = ZERO;

    entity.affiliatesCount = ZERO;
    entity.affiliatesCountCumulative = ZERO;

    entity.referralsCount = ZERO;
    entity.referralsCountCumulative = ZERO;

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

export function getOrCreateAffiliateStat(
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
    entity.volume = ZERO;
    entity.volumeCumulative = ZERO;
    entity.trades = ZERO;
    entity.tradesCumulative = ZERO;
    entity.tradedReferralsCount = ZERO;
    entity.tradedReferralsCountCumulative = ZERO;
    entity.registeredReferralsCount = ZERO;
    entity.registeredReferralsCountCumulative = ZERO;

    entity.totalRebateUsd = ZERO;
    entity.totalRebateUsdCumulative = ZERO;
    entity.discountUsd = ZERO;
    entity.discountUsdCumulative = ZERO;

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

function _createAffiliateStatData(
  affiliateStatId: string,
  version: Version
): AffiliateStatData {
  let id = affiliateStatId + ":" + version;
  let entity = new AffiliateStatData(id);
  entity.volume = ZERO;
  entity.volumeCumulative = ZERO;
  entity.totalRebateUsd = ZERO;
  entity.totalRebateUsdCumulative = ZERO;
  entity.discountUsd = ZERO;
  entity.discountUsdCumulative = ZERO;
  entity.trades = ZERO;
  entity.tradesCumulative = ZERO;

  entity.save();
  return entity;
}
