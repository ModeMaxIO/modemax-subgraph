function createMarketConfig(
  marketToken: string,
  indexToken: string,
  longToken: string,
  shortToken: string
): MarketConfig {
  return new MarketConfig(marketToken, indexToken, longToken, shortToken);
}

export class MarketConfig {
  constructor(
    public marketToken: string,
    public indexToken: string,
    public longToken: string,
    public shortToken: string
  ) {}
}

export let marketConfigs = new Map<string, MarketConfig>();
// CP marketConfigs index: WBTC  long: WBTC  short: USDT
marketConfigs.set(
    "0x12c3F0C1a13442E5c5818B39b2ee7d7606320527",
    createMarketConfig(
        "0x12c3F0C1a13442E5c5818B39b2ee7d7606320527",
        "0x00d84e62a854e54ba7289ab6506f95000bb4b008",
        "0x00d84e62a854e54ba7289ab6506f95000bb4b008",
        "0x4557d5f50828302db39d9530f6d3648d48bec04a"
    )
);
// CP marketConfigs  index: MODE  long: MODE  short: USDT
marketConfigs.set(
    "0x5558699453020301b4053c3ce95619e30a3f87d6",
    createMarketConfig(
        "0x5558699453020301b4053c3ce95619e30a3f87d6",
        "0x4ffa6cdeb4def980b75e3f4764797a2cad1faef3",
        "0x4ffa6cdeb4def980b75e3f4764797a2cad1faef3",
        "0x4557d5f50828302db39d9530f6d3648d48bec04a"
    )
);
// CP marketConfigs  index: MODE  long: MODE.m short: USDT.m
marketConfigs.set(
    "0xa0dce6125a42e68849d646da8b3deab8dfd01918",
    createMarketConfig(
        "0xa0dce6125a42e68849d646da8b3deab8dfd01918",
        "0x4ffa6cdeb4def980b75e3f4764797a2cad1faef3",
        "0xc14092d39d4b9034b41b2d00581e8b4cb282611f",
        "0x1bfa66cb34851b98b5d23cadc554bbb4cba881f6"
    )
);
// CP marketConfigs  index: WETH  long: WETH  short: USDT
marketConfigs.set(
    "0x341a0c0704670ed7e27e467a842fd9e1e8eed43d",
    createMarketConfig(
        "0x341a0c0704670ed7e27e467a842fd9e1e8eed43d",
        "0x5ce359ff65f8bc3c874c16fa24a2c1fd26bb57cd",
        "0x5ce359ff65f8bc3c874c16fa24a2c1fd26bb57cd",
        "0x4557d5f50828302db39d9530f6d3648d48bec04a"
    )
);
// END CP market
