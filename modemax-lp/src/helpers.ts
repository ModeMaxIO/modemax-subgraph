import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { BI_ONE, BI_ZERO } from "./const";

const DAY = BigInt.fromI32(3600*24);

export function getDayStartTimestamp(timestamp: i32): i32 {
  const biTime = BigInt.fromI32(timestamp);
  return biTime.div(DAY).times(DAY).toI32();
}

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = BI_ZERO; i.lt(BigInt.fromI32(decimals)); i = i.plus(BI_ONE)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}