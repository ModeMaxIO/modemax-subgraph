import { IncreasePosition as IncreasePositionEvent, DecreasePosition as DecreasePositionEvent } from "../generated/Vault/Vault";
import { storeReferralOfUserStat } from "./schema-helper";

export function handleIncreasePosition(event: IncreasePositionEvent): void {
  const account = event.params.account.toHexString()
  storeReferralOfUserStat(account, event.params.sizeDelta);
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  const account = event.params.account.toHexString()
  storeReferralOfUserStat(account, event.params.sizeDelta);
}