import { ReferralCode, TraderToReferralCode } from "../generated/schema";

export function loadOrCreateReferralCode(code: string): ReferralCode {

  let referralCode = ReferralCode.load(code);
  if (!referralCode) {
    referralCode = new ReferralCode(code);
    referralCode.owner = '';
    referralCode.traderLatestIndex = 0;
    referralCode.code = code;
    referralCode.save();
  }
  return referralCode;
}

export function getReferralCode(account: string): string {
  let traderToReferralCode = TraderToReferralCode.load(account);
  if (traderToReferralCode == null) {
    return "";
  }
  return traderToReferralCode.referralCode;
}

export function getReferralCodeOwner(account: string, code: string): string {
  let owner = ""
  if (code != "") {
    let referralCode = ReferralCode.load(code);
    if (referralCode) {
      let affiliate = referralCode.owner;
      if (affiliate != account) {
        owner = affiliate;
      }
    }
  }
  return owner;
}