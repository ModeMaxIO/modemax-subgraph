import { RegisterCode as RegisterCodeEvent, SetCodeOwner as SetCodeOwnerEvent, GovSetCodeOwner as GovSetCodeOwnerEvent, SetTraderReferralCode as SetTraderReferralCodeEvent } from "../generated/ReferralStorage/ReferralStorage"
import { ReferralCode, TraderToReferralCode } from "../generated/schema"
import { loadOrCreateReferralCode } from "./referral-storage-schema-helper";

export function handleRegisterCode(event: RegisterCodeEvent): void {
  const referralCode = loadOrCreateReferralCode(event.params.code.toHexString());
  referralCode.owner = event.params.account.toHexString();
  referralCode.save();
}

export function handleSetCodeOwner(event: SetCodeOwnerEvent): void {
  const referralCode = loadOrCreateReferralCode(event.params.code.toHexString());
  referralCode.owner = event.params.newAccount.toHexString();
  referralCode.save();
}

export function handleGovSetCodeOwner(event: GovSetCodeOwnerEvent): void {
  const referralCode = loadOrCreateReferralCode(event.params.code.toHexString());
  referralCode.owner = event.params.newAccount.toHexString();
  referralCode.save();
}

export function handleSetTraderReferralCode(event: SetTraderReferralCodeEvent): void {
  let referralCode = ReferralCode.load(event.params.code.toHexString());
  if (!referralCode) {
    return;
  }
  let traderToReferralCode = new TraderToReferralCode(event.params.account.toHexString());
  traderToReferralCode.referralCode = event.params.code.toHexString();
  traderToReferralCode.index = referralCode.traderLatestIndex;
  traderToReferralCode.timestamp = event.block.timestamp.toI32();
  traderToReferralCode.save();
  referralCode.traderLatestIndex++;
  referralCode.save();
}

