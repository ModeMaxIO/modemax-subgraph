import {BigInt, log, TypedMap} from '@graphprotocol/graph-ts'
import { ChainlinkPrice, UniswapPrice } from '../generated/schema'

export let BASIS_POINTS_DIVISOR = BigInt.fromI32(10000)
export let PRECISION = BigInt.fromI32(10).pow(30)

export let WETH = '0x5ed4813824e5e2baf9bbc211121b21ab38e02522'
export let BTC = '0xfa600253bb6fe44ceab0538000a8448807e50c85'
export let USDT = '0x9d973bac12bb62a55be0f9f7ad201eea4f9b8428'
export let SYS = '0xcac0759160d57a33d332ed36a555c10957694407'
export let USDC = '0xf111aa386823c4cf33f349597f1e772973ac0913'

export let DAI = '0x66a1b915b55bde2fa3402ed59bb5af19879c1178'
//REX
export let GMX = '0xe32abbc6b2393af05d944118cc95787bf5777897'

export function timestampToDay(timestamp: BigInt): BigInt {
  return (timestamp / BigInt.fromI32(86400)) * BigInt.fromI32(86400)
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

  return (timestamp / periodTime) * periodTime
}

export function getTokenDecimals(token: String): u8 {
  //   let tokenDecimals = new Map<String, i32>()
  //   tokenDecimals.set(WETH, 18)
  //   tokenDecimals.set(BTC, 18)
  //   tokenDecimals.set(LINK, 18)
  //   tokenDecimals.set(USDT, 18)
  //   tokenDecimals.set(AVAX, 18)
  //   tokenDecimals.set(GMX, 18)

  //   tokenDecimals.set(UNI, 18)
  //   tokenDecimals.set(USDC, 6)
  //   tokenDecimals.set(USDCe, 6)
  //   tokenDecimals.set(MIM, 18)
  //   tokenDecimals.set(SPELL, 18)
  //   tokenDecimals.set(SUSHI, 18)
  //   tokenDecimals.set(FRAX, 18)
  //   tokenDecimals.set(DAI, 18)
  let decimals = 0
  if (token == WETH) {
    decimals = 18
  } else if (token == BTC) {
    decimals = 18
  } else if (token == DAI) {
    decimals = 18
  } else if (token == SYS) {
    decimals = 18
  } else if (token == USDT) {
    decimals = 6
  }else if (token == USDC) {
    decimals = 6
  } else if (token == GMX) {
    decimals = 18
  }
  if (decimals == 0) {
    throw new Error('Unsupported token ' + token)
  }

  return decimals as u8
}

export function getTokenAmountUsd(token: String, amount: BigInt): BigInt {
  let decimals = getTokenDecimals(token)
  let denominator = BigInt.fromI32(10).pow(decimals)
  let price = getTokenPrice(token)
  return (amount * price) / denominator
}

export function getTokenPrice(token: String): BigInt {
  if (token != GMX) {
    let chainlinkPriceEntity = ChainlinkPrice.load(token)
    if (chainlinkPriceEntity != null) {
      // all chainlink prices have 8 decimals
      // adjusting them to fit GMX 30 decimals USD values
      return chainlinkPriceEntity.value * BigInt.fromI32(10).pow(22)
    }
  }

  if (token == GMX) {
    let uniswapPriceEntity = UniswapPrice.load(GMX)

    if (uniswapPriceEntity != null) {
      return uniswapPriceEntity.value
    }
  }

  let prices = new TypedMap<String, BigInt>()
  prices.set(WETH, BigInt.fromI32(1580) * PRECISION)
  prices.set(BTC, BigInt.fromI32(25920) * PRECISION)
  prices.set(SYS, (BigInt.fromI32(832) * PRECISION) / BigInt.fromI32(10000))
  prices.set(DAI, PRECISION)
  prices.set(USDT, PRECISION)
  prices.set(USDC, PRECISION)
  prices.set(GMX, BigInt.fromI32(30) * PRECISION)

  return prices.get(token) as BigInt
}

export function getLast24Hour(timestamp: BigInt): BigInt{
  let HOUR_SECONDS = BigInt.fromI32(60 * 60);
  return timestamp.minus(BigInt.fromI32(24).times(HOUR_SECONDS));
}
