import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const ZeroAddress = '0x0000000000000000000000000000000000000000';
export const BD_ZERO = BigDecimal.fromString('0');
export const BD_ONE = BigDecimal.fromString('1');
export const BI_ZERO = BigInt.fromI32(0);
export const BI_ONE = BigInt.fromI32(1);
export const DECIMAL30 = BigDecimal.fromString("1000000000000000000000000000000");
export const DECIMAL18 = BigDecimal.fromString("1000000000000000000");


// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('50')

// minimum liquidity for price to get tracked
export const MINIMUM_LIQUIDITY_THRESHOLD_USD = BigDecimal.fromString('50')

// ex. usdt,usdc
export const USD_ANCHOR = Address.fromHexString('0xd988097fb8612cc24eeC14542bC03424c656005f');