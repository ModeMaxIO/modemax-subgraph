import { BigInt } from "@graphprotocol/graph-ts";
import { loadOrCreateUserStat } from "./event-emitter-schema-helper";
import { getReferralCode, getReferralCodeOwner } from "./referral-storage-schema-helper";
import { DECIMAL30 } from "./const";

export function storeReferralOfUserStat(account: string, sizeDelta: BigInt): void {
  let referralCode = getReferralCode(account);
  if (referralCode != "") {
    let owner = getReferralCodeOwner(account, referralCode);
    if (owner != "") {
      const userStat = loadOrCreateUserStat(owner);
      userStat.referral = userStat.referral.plus(sizeDelta.toBigDecimal().div(DECIMAL30));
      userStat.save();
    }
  }
}