import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { BI_ONE, BI_ZERO } from "./const"

const HOUR = BigInt.fromI32(3600);

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = BI_ZERO; i.lt(decimals as BigInt); i = i.plus(BI_ONE)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: number): BigDecimal {
  if (exchangeDecimals == 0) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(BigInt.fromI32(exchangeDecimals as i32)))
}

export function getHourStartTimestamp(timestamp: i32): i32 {
  const biTime = BigInt.fromI32(timestamp);
  return biTime.div(HOUR).times(HOUR).toI32();
}
