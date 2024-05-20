import {BigInt, log, TypedMap} from '@graphprotocol/graph-ts'
import { ChainlinkPrice, UniswapPrice } from '../generated/schema'

export let BASIS_POINTS_DIVISOR = BigInt.fromI32(10000)
export let PRECISION = BigInt.fromI32(10).pow(30)

export let WETH = '0x5ce359ff65f8bc3c874c16fa24a2c1fd26bb57cd'
export let BTC = '0x00d84e62a854e54ba7289ab6506f95000bb4b008'
export let USDT = '0x4557d5f50828302db39d9530f6d3648d48bec04a'
// MODE
export let SYS = '0x4ffa6cdeb4def980b75e3f4764797a2cad1faef3'
export let USDC = '0x22198b46c84cf43831e65d32a9403a194d617a61'

// Deprecated
export let DAI = '0x66a1b915b55bde2fa3402ed59bb5af19879c1178'
//MOX
export let GMX = '0xadb02879f2b446e26da80139a91c93af1fec017b'

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
