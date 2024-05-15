import {BigDecimal, BigInt, ethereum, json} from '@graphprotocol/graph-ts'
import {LeaderboardData} from '../generated/schema'

let ZERO = BigInt.fromI32(0)

export function _getWeekId(timestamp: BigInt): string{
    let MILLS = BigInt.fromI32(1000);
    let date = new Date(timestamp.times(MILLS).toI64());
    let y = date.getUTCFullYear();
    let m = date.getUTCMonth();
    let d = date.getUTCDate() - date.getUTCDay() +1;
    let time = Date.UTC(y, m, d, 0, 0, 0, 0)
    return BigInt.fromI64(time).div(MILLS).toI32().toString();
}

export function _getDayId(timestamp: BigInt): string {
    let dayTimestamp = (timestamp.toI32() / 86400) * 86400
    return dayTimestamp.toString()
}

export function _getHourId(timestamp: BigInt): string {
    let hour = BigInt.fromI32(3600)
    return timestamp.div(hour).times(hour).toString()
}

export function _getMonthId(timestamp: BigInt): string {
    let MILLS = BigInt.fromI32(1000);
    let date = new Date(timestamp.times(MILLS).toI64());
    let y = date.getUTCFullYear();
    let m = date.getUTCMonth();
    let time = Date.UTC(y, m, 1, 0, 0, 0, 0)
    return BigInt.fromI64(time).div(MILLS).toI32().toString();
}

export function getIdFromEvent(event: ethereum.Event): string {
    return event.transaction.hash.toHexString() + ":" + event.logIndex.toString();
}

function _now():BigInt{
    let now = Date.now();
    return BigInt.fromI32(now/1000);
}