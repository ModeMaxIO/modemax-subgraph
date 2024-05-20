let BTC_PRICE_FEED = '0x3fba88708b3527f5ff7cb5e20dceb61ece6ebc99'
let ETH_PRICE_FEED = '0x2a8d0136347b3667ba600e6f985aec971a97a9e0'
let MODE_PRICE_FEED = '0xb18bc449665e920dba132974c9d43132a016dc9f'
let USDT_PRICE_FEED = '0xc626d70429bf4ae3213db6ed610f9817cbfc271f'
let USDC_PRICE_FEED = '0x161dd2477e60b77435474b1eaf94345da8687bac'

let WETH = '0x5ce359ff65f8bc3c874c16fa24a2c1fd26bb57cd'
let BTC = '0x00d84e62a854e54ba7289ab6506f95000bb4b008'
let USDT = '0x4557d5f50828302db39d9530f6d3648d48bec04a'
let MODE = '0x4ffa6cdeb4def980b75e3f4764797a2cad1faef3'
let USDC = '0x22198b46c84cf43831e65d32a9403a194d617a61'


export function getTokenByPriceFeed(priceFeed: string): string[] {
  if (priceFeed == ETH_PRICE_FEED) {
    return [WETH]
  } else if (priceFeed == MODE_PRICE_FEED) {
    return [MODE]
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
  } else if (tokenAddress == MODE) {
    return 18
  }  else if (tokenAddress == USDT) {
    return 6
  } else if (tokenAddress == BTC) {
    return 18
  } else if (tokenAddress == USDC) {
    return 6
  }

  return 0
}
