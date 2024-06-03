let BTC_PRICE_FEED = '0xabeb3f39bf6077e7115eaa96c073b4b229d0045d'
let ETH_PRICE_FEED = '0xfe81e8193cf987037f8ea1c9a63d03ad1b5c724f'
let WETH_PRICE_FEED = '0xfa0947e5c0d47c1a4bee1b0c415e1a1b6c1c07ca'
let MODE_PRICE_FEED = '0x97cbc84aa17c72a0c0dcf2f54136cb378261bad1'
let USDT_PRICE_FEED = '0x314942bb8fec90c8d50d7d53f9bab5482e1e9622'
let USDC_PRICE_FEED = '0x96209fb74ca298946ff5c283f1bb2364744c904d'

let ETH = '0xc7b06f55fbcd31cd691504f3dfc4efa9082616b7'
let WETH = '0xc7b06f55fbcd31cd691504f3dfc4efa9082616b7'
let BTC = '0x00d84e62a854e54ba7289ab6506f95000bb4b008'
let USDT = '0x4557d5f50828302db39d9530f6d3648d48bec04a'
let USDT_M = '0x1bfa66cb34851b98b5d23cadc554bbb4cba881f6'
let USDC = '0x22198b46c84cf43831e65d32a9403a194d617a61'
let MODE = '0x4ffa6cdeb4def980b75e3f4764797a2cad1faef3'
let MODE_M = '0xc14092d39d4b9034b41b2d00581e8b4cb282611f'

export function getTokenByPriceFeed(priceFeed: string): string[] {
  if (priceFeed == ETH_PRICE_FEED) {
    return [ETH]
  } else if (priceFeed == WETH_PRICE_FEED) {
    return [WETH]
  } else if (priceFeed == MODE_PRICE_FEED) {
    return [MODE]
  }else if (priceFeed == USDT_PRICE_FEED) {
    return [USDT]
  } else if (priceFeed == BTC_PRICE_FEED) {
    return [BTC]
  }else if (priceFeed == USDC_PRICE_FEED) {
    return [USDC]
  }

  return []
}

export function getTokenDecimals(tokenAddress: string): number {
  if (tokenAddress == WETH) {
    return 18
  } else if (tokenAddress == ETH) {
    return 18
  } else if (tokenAddress == MODE) {
    return 18
  } else if (tokenAddress == MODE_M) {
    return 18
  } else if (tokenAddress == USDT) {
    return 6
  } else if (tokenAddress == USDT_M) {
    return 6
  } else if (tokenAddress == BTC) {
    return 18
  } else if (tokenAddress == USDC) {
    return 6
  }

  return 0
}
