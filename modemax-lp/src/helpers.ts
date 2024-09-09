import { BigInt } from "@graphprotocol/graph-ts";

const DAY = BigInt.fromI32(3600*24);

export function getDayStartTimestamp(timestamp: i32): i32 {
  const biTime = BigInt.fromI32(timestamp);
  return biTime.div(DAY).times(DAY).toI32();
}