import { BigInt } from "@graphprotocol/graph-ts";

export function timestampToDay(timestamp: BigInt): BigInt {
  return (timestamp.div(BigInt.fromI32(86400))).times(BigInt.fromI32(86400))
}

export function timestampToPeriod(timestamp: BigInt, period: string): BigInt {
  let periodTime: BigInt

  if (period == 'daily') {
    periodTime = BigInt.fromI32(86400)
  } else if (period == 'hourly') {
    periodTime = BigInt.fromI32(3600)
  } else if (period == 'weekly') {
    periodTime = BigInt.fromI32(86400 * 7)
  } else {
    throw new Error('Unsupported period ' + period)
  }

  return (timestamp.div(periodTime)).times(periodTime)
}

export function getHourId(timestamp: BigInt): string {
  let hourTimestamp = (timestamp.div(BigInt.fromI32(3600))).times(BigInt.fromI32(3600))
  return hourTimestamp.toString()
}

export function getWeekId(timestamp: BigInt): string {
  let day = 86400
  let week = day * 7
  let weekTimestamp = (timestamp.toI32() / week) * week - 3 * day
  return weekTimestamp.toString()
}

export function getDayId(timestamp: BigInt): string {
  let dayTimestamp = (timestamp.toI32() / 86400) * 86400
  return dayTimestamp.toString()
}