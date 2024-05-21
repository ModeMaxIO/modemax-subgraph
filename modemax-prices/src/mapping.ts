import {Address, BigInt, Bytes, ethereum,log} from "@graphprotocol/graph-ts";
import { PriceUpdate } from '../generated/FastPriceEvents/FastPriceEvents'
import {PriceCandle, TokenPrice, TokenPrice24h,} from '../generated/schema'

function getMax(a: BigInt, b: BigInt): BigInt {
  return a > b ? a : b
}

function getMin(a: BigInt, b: BigInt): BigInt {
  return a < b ? a : b
}

function timestampToPeriodStart(timestamp: BigInt, period: string): BigInt {
  let seconds = periodToSeconds(period)
  return (timestamp / seconds) * seconds
}
function periodToSeconds(period: string): BigInt {
  let seconds: BigInt
  if (period == '1m') {
    seconds = BigInt.fromI32(60)
  } else if (period == '5m') {
    seconds = BigInt.fromI32(5 * 60)
  } else if (period == '15m') {
    seconds = BigInt.fromI32(15 * 60)
  } else if (period == '1h') {
    seconds = BigInt.fromI32(60 * 60)
  } else if (period == '4h') {
    seconds = BigInt.fromI32(4 * 60 * 60)
  } else if (period == '1d') {
    seconds = BigInt.fromI32(24 * 60 * 60)
  } else {
    throw new Error('Invalid period')
  }
  return seconds
}

function getId(
  token: Address,
  period: string,
  periodStart: BigInt,
  event: ethereum.Event
): string {
  if (period == 'any') {
    return (
      token.toHexString() +
      ':' +
      period +
      ':' +
      event.transaction.hash.toHexString()
    )
  }
  return token.toHexString() + ':' + period + ':' + periodStart.toString()
}

function updateCandle(event: PriceUpdate, period: string): void {
  let periodStart = timestampToPeriodStart(event.block.timestamp, period)
  let id = getId(event.params.token, period, periodStart, event)
  let entity = PriceCandle.load(id)

  if (entity == null) {
    let prevId = getId(
      event.params.token,
      period,
      periodStart - periodToSeconds(period),
      event
    )
    let prevEntity = PriceCandle.load(prevId)

    entity = new PriceCandle(id)

    entity.period = period

    if (prevEntity == null) {
      entity.open = event.params.price
    } else {
      entity.open = prevEntity.close
    }
    entity.close = event.params.price
    entity.high = getMax(entity.open, entity.close)
    entity.low = getMin(entity.open, entity.close)
    entity.timestamp = periodStart.toI32()
    entity.token = event.params.token.toHexString()
  } else {
    entity.high = getMax(entity.high, event.params.price)
    entity.low = getMin(entity.low, event.params.price)
    entity.close = event.params.price
  }

  entity.save()
}

export function handlePriceUpdate(event: PriceUpdate): void {
  updateCandle(event, '1m')
  updateCandle(event, '5m')
  updateCandle(event, '15m')
  updateCandle(event, '1h')
  updateCandle(event, '4h')
  updateCandle(event, '1d')
  // saveBlock(event.block.hash, event.block.number, event.block.timestamp)

  // stores token prices in the last 24 hours
  _storeTokenPrice24h(event);

  // token max and min price
  _storeTokenPrice(event);
}

// function saveBlock(hash: Bytes, number: BigInt, timestamp: BigInt): void {
//   let id = hash.toHex()
//   let blockEntity = Block.load(id)
//   if (blockEntity === null) {
//     blockEntity = new Block(id)
//     blockEntity.number = number
//     blockEntity.timestamp = timestamp
//     blockEntity.save()
//   }
// }


function _storeTokenPrice24h(event: PriceUpdate): void{
  let timestamp = event.block.timestamp;
  let token = event.params.token.toHexString();
  let price = event.params.price;

  let tokenPrice24h = TokenPrice24h.load(token);
  let hours24Seconds = BigInt.fromI32(24 * 60 * 60).toI32();

  if(tokenPrice24h==null){
    tokenPrice24h = new TokenPrice24h(token);
    tokenPrice24h.low = price;
    tokenPrice24h.lowTimestamp = timestamp.toI32();
    tokenPrice24h.height = price;
    tokenPrice24h.heightTimestamp = timestamp.toI32();
    tokenPrice24h.open = price;
    tokenPrice24h.close = BigInt.fromI32(0);
    tokenPrice24h.timestamp = timestamp.toI32();
  }else{

    let heightTimestamp = tokenPrice24h.heightTimestamp;
    let lowTimestamp = tokenPrice24h.lowTimestamp;

    if((timestamp.toI32() - heightTimestamp) <= hours24Seconds){
      if(price.gt(tokenPrice24h.height)){
        tokenPrice24h.height = price;
        tokenPrice24h.heightTimestamp = timestamp.toI32();
      }
    } else {
      tokenPrice24h.height = price;
      tokenPrice24h.heightTimestamp = timestamp.toI32();
    }

    if((timestamp.toI32() - lowTimestamp) <= hours24Seconds){
      if(price.lt(tokenPrice24h.low)){
        tokenPrice24h.low = price;
        tokenPrice24h.lowTimestamp = timestamp.toI32();
      }
    } else {
      tokenPrice24h.low = price;
      tokenPrice24h.lowTimestamp = timestamp.toI32();
    }
    if((timestamp.toI32() - tokenPrice24h.timestamp )>= hours24Seconds){
      tokenPrice24h.open = tokenPrice24h.close;
      tokenPrice24h.close = price;
      tokenPrice24h.timestamp = timestamp.toI32();
    }
  }
  tokenPrice24h.save();

}


function _storeTokenPrice(event: PriceUpdate):void{
  let period = "1m";
  let periodStart = timestampToPeriodStart(event.block.timestamp, period);
  let id = getId(event.params.token, period, periodStart, event);
  let priceCandle = PriceCandle.load(id);

  let token = event.params.token.toHexString();
  let price = event.params.price;
  let tokenPrice = TokenPrice.load(token);
  if(tokenPrice==null){
    tokenPrice = new TokenPrice(token);
    if(priceCandle!=null){
      tokenPrice.maxPrice = priceCandle.high;
      tokenPrice.minPrice = priceCandle.low;
    }else{
      tokenPrice.maxPrice = price;
      tokenPrice.minPrice = price;
    }
  }else{
    if(priceCandle!=null){
      tokenPrice.maxPrice = priceCandle.high;
      tokenPrice.minPrice = priceCandle.low;
    }else{
      if(price.gt(tokenPrice.maxPrice)){
        tokenPrice.maxPrice = price;
      }
      if(price.lt(tokenPrice.minPrice)){
        tokenPrice.minPrice = price;
      }
    }
  }
  tokenPrice.timestamp = event.block.timestamp.toI32();
  tokenPrice.save();
}