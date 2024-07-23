import { UserStat } from "../generated/schema";
import { BIGDECIMAL_ZERO } from "./const";
export function loadOrCreateUserStat(account: string): UserStat {
  const id = account;
  let userStat = UserStat.load(id);
  if (!userStat) {
    userStat = new UserStat(id);
    userStat.lp = BIGDECIMAL_ZERO;
    userStat.trade = BIGDECIMAL_ZERO;
    userStat.referral = BIGDECIMAL_ZERO;
    userStat.swap = BIGDECIMAL_ZERO;
    userStat.save();
  }
  return userStat;
}