let BTC_PRICE_FEED = '0xb921aee0abd048e2fdd1e15ab2ddfbe589884522'
let ETH_PRICE_FEED = '0x8f1ba66d30a1f01bd766eb3bab0e8afbee164252'
let SYS_PRICE_FEED = '0x9dff2cebcca79f9090340604b58612fc3e818dcb'
let USDT_PRICE_FEED = '0xf631c28f3cb32301cd6fe005feccbf24f1bba3c4'
let USDC_PRICE_FEED = '0x2530cbf4c00bc1839f76f5524de92825bf045090'

let WETH = '0x5ed4813824e5e2baf9bbc211121b21ab38e02522'
let BTC = '0xfa600253bb6fe44ceab0538000a8448807e50c85'
let USDT = '0x9d973bac12bb62a55be0f9f7ad201eea4f9b8428'
let SYS = '0xcac0759160d57a33d332ed36a555c10957694407'
let USDC = '0xf111aa386823c4cf33f349597f1e772973ac0913'

let DAI = '0x66a1b915b55bde2fa3402ed59bb5af19879c1178'
let DAI_PRICE_FEED = '0x8d2644f9d95453cc474ce3a92cefe4b1a28aab0b'

export function getTokenByPriceFeed(priceFeed: string): string[] {
  if (priceFeed == ETH_PRICE_FEED) {
    return [WETH]
  } else if (priceFeed == SYS_PRICE_FEED) {
    return [SYS]
  } else if (priceFeed == DAI_PRICE_FEED) {
    return [DAI]
  } else if (priceFeed == USDT_PRICE_FEED) {
    return [USDT]
  } else if (priceFeed == BTC_PRICE_FEED) {
    return [BTC]
  } else if (priceFeed == USDC_PRICE_FEED) {
    return [BTC]
  }

  return []
}

export function getTokenDecimals(tokenAddress: string): number {
  if (tokenAddress == WETH) {
    return 18
  } else if (tokenAddress == SYS) {
    return 18
  } else if (tokenAddress == DAI) {
    return 18
  } else if (tokenAddress == USDT) {
    return 6
  } else if (tokenAddress == BTC) {
    return 18
  } else if (tokenAddress == USDC) {
    return 6
  }

  return 0
}
