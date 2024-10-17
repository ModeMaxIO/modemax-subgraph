import { Affiliate, ReferralCode, RegisteredReferral, TraderToReferralCode } from "../generated/schema";
import { GovSetCodeOwner, RegisterCode, SetCodeOwner, SetReferrerDiscountShare, SetReferrerTier, SetTier, SetTraderReferralCode } from "../generated/ReferralStorage/ReferralStorage";
import { getOrCreateAffiliate, getOrCreateAffiliateStat, getOrCreateGlobalStat, getOrCreateTier } from "./helpers/schema-helpers";
import { ONE, ZERO } from "./helpers/constant";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

export function handleGovSetCodeOwner(event: GovSetCodeOwner): void {
  let referralCodeEntity = ReferralCode.load(event.params.code.toHexString());
  if (referralCodeEntity == null) {
    _registerCode(
      event.block.timestamp,
      event.params.code,
      event.params.newAccount
    );
  } else {
    referralCodeEntity.owner = event.params.newAccount.toHexString();
    referralCodeEntity.save();
  }
}

export function handleRegisterCode(event: RegisterCode): void {
  _registerCode(event.block.timestamp, event.params.code, event.params.account);
}

export function handleSetCodeOwner(event: SetCodeOwner): void {
  let referralCodeEntity = ReferralCode.load(event.params.code.toHexString());
  if (referralCodeEntity == null) {
    _registerCode(
      event.block.timestamp,
      event.params.code,
      event.params.newAccount
    );
  } else {
    referralCodeEntity.owner = event.params.newAccount.toHexString();
    referralCodeEntity.save();
  }
}


export function handleSetReferrerDiscountShare(
  event: SetReferrerDiscountShare
): void {
  let entity = getOrCreateAffiliate(event.params.referrer.toHexString());
  entity.discountShare = event.params.discountShare;
  entity.save();
}

export function handleSetReferrerTier(event: SetReferrerTier): void {
  let entity = getOrCreateAffiliate(event.params.referrer.toHexString());
  entity.tierId = event.params.tierId;
  entity.save();
}

export function handleSetTier(event: SetTier): void {
  let entity = getOrCreateTier(event.params.tierId.toString());
  entity.totalRebate = event.params.totalRebate;
  entity.discountShare = event.params.discountShare;
  entity.save();
}

export function handleSetTraderReferralCode(
  event: SetTraderReferralCode
): void {
  let referralCodeEntity = ReferralCode.load(event.params.code.toHexString());
  if (referralCodeEntity == null) {
    // SetTraderReferralCode can be emitted with non-existent code
    return;
  }

  let traderToReferralCode = new TraderToReferralCode(
    event.params.account.toHexString()
  );
  traderToReferralCode.index = referralCodeEntity.traderLatestIndex;
  traderToReferralCode.timestamp = event.block.timestamp.toI32();
  traderToReferralCode.referralCode = event.params.code.toHexString();
  traderToReferralCode.save();
  referralCodeEntity.traderLatestIndex++;
  referralCodeEntity.save();

  let timestamp = event.block.timestamp;

  // global stats
  let totalGlobalStatEntity = getOrCreateGlobalStat(timestamp, "total", null);
  totalGlobalStatEntity.referralsCount = totalGlobalStatEntity.referralsCount.plus(ONE);
  totalGlobalStatEntity.referralsCountCumulative = totalGlobalStatEntity.referralsCountCumulative.plus(ONE);
  totalGlobalStatEntity.save();

  let dailyGlobalStatEntity = getOrCreateGlobalStat(
    timestamp,
    "daily",
    totalGlobalStatEntity
  );
  dailyGlobalStatEntity.referralsCount = dailyGlobalStatEntity.referralsCount.plus(ONE);
  dailyGlobalStatEntity.save();

  // affiliate stats
  let affiliate = Address.fromString(referralCodeEntity.owner);
  let totalAffiliateStatEntity = getOrCreateAffiliateStat(
    timestamp,
    "total",
    affiliate,
    event.params.code.toHex()
  );
  if (
    _createRegisteredReferralIfNotExist(
      totalAffiliateStatEntity.id,
      event.params.account
    )
  ) {
    totalAffiliateStatEntity.registeredReferralsCount = totalAffiliateStatEntity.registeredReferralsCount.plus(ONE);
    totalAffiliateStatEntity.registeredReferralsCountCumulative = totalAffiliateStatEntity.registeredReferralsCountCumulative.plus(ONE);
    totalAffiliateStatEntity.save();
  }

  let dailyAffiliateStatEntity = getOrCreateAffiliateStat(
    timestamp,
    "daily",
    affiliate,
    event.params.code.toHex()
  );
  if (
    _createRegisteredReferralIfNotExist(
      dailyAffiliateStatEntity.id,
      event.params.account
    )
  ) {
    dailyAffiliateStatEntity.registeredReferralsCount = dailyAffiliateStatEntity.registeredReferralsCount.plus(ONE);
  }
  dailyAffiliateStatEntity.registeredReferralsCountCumulative =
    totalAffiliateStatEntity.registeredReferralsCountCumulative;
  dailyAffiliateStatEntity.save();
}


// private functions

function _registerCode(timestamp: BigInt, code: Bytes, owner: Address): void {
  let affiliateResult = _getOrCreateAffiliateWithCreatedFlag(
    owner.toHexString()
  );
  let affiliateCreated = affiliateResult.created;

  let referralCodeEntity = new ReferralCode(code.toHexString());
  referralCodeEntity.owner = owner.toHexString();
  referralCodeEntity.code = code.toHex();
  referralCodeEntity.traderLatestIndex = 0;
  referralCodeEntity.save();

  let totalAffiliateStat = getOrCreateAffiliateStat(
    timestamp,
    "total",
    owner,
    code.toHex()
  );
  totalAffiliateStat.save();

  let dailyAffiliateStat = getOrCreateAffiliateStat(
    timestamp,
    "daily",
    owner,
    code.toHex()
  );
  dailyAffiliateStat.save();

  let totalGlobalStatEntity = getOrCreateGlobalStat(timestamp, "total", null);
  totalGlobalStatEntity.referralCodesCount = totalGlobalStatEntity.referralCodesCount.plus(ONE);
  totalGlobalStatEntity.referralCodesCountCumulative =
    totalGlobalStatEntity.referralCodesCount;
  if (affiliateCreated) {
    totalGlobalStatEntity.affiliatesCount = totalGlobalStatEntity.affiliatesCount.plus(ONE);
    totalGlobalStatEntity.affiliatesCountCumulative =
      totalGlobalStatEntity.affiliatesCount;
  }
  totalGlobalStatEntity.save();

  let dailyGlobalStatEntity = getOrCreateGlobalStat(
    timestamp,
    "daily",
    totalGlobalStatEntity
  );
  dailyGlobalStatEntity.referralCodesCount = dailyGlobalStatEntity.referralCodesCount.plus(ONE);
  if (affiliateCreated) {
    dailyGlobalStatEntity.affiliatesCount = dailyGlobalStatEntity.affiliatesCount.plus(ONE);
  }
  dailyGlobalStatEntity.save();
}

function _createRegisteredReferralIfNotExist(
  affiliateStatId: string,
  referral: Address
): boolean {
  let id = affiliateStatId + ":" + referral.toHexString();
  let entity = RegisteredReferral.load(id);
  if (entity == null) {
    entity = new RegisteredReferral(id);
    entity.affiliateStat = affiliateStatId;
    entity.referral = referral.toHexString();
    entity.save();
    return true;
  }
  return false;
}


function _getOrCreateAffiliateWithCreatedFlag(id: string): AffiliateResult {
  let entity = Affiliate.load(id);
  let created = false;
  if (entity == null) {
    entity = new Affiliate(id);
    entity.tierId = ZERO;
    entity.discountShare = ZERO;
    entity.save();
    created = true;
  }
  return new AffiliateResult(entity as Affiliate, created);
}

class AffiliateResult {
  created: boolean;
  entity: Affiliate;

  constructor(entity: Affiliate, created: boolean) {
    this.entity = entity;
    this.created = created;
  }
}
