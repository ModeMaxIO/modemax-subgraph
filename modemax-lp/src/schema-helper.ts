import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { loadOrCreateUserStat } from "./event-emitter-schema-helper";
import { getReferralCode, getReferralCodeOwner } from "./referral-storage-schema-helper";
import { C_STAKED_TOKEN, DECIMAL30, ZeroAddress } from "./const";
import { ContractBundle } from "../generated/schema";

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

export function createStakedTokenBundle(address: Bytes): ContractBundle {
  const id = C_STAKED_TOKEN;
  let b = ContractBundle.load(id);
  if (!b) {
    b = new ContractBundle(id);
    b.address = address;
    b.save();
  }
  return b;
}

export function loadStakedToken(): ContractBundle | null {
  return ContractBundle.load(C_STAKED_TOKEN);
}