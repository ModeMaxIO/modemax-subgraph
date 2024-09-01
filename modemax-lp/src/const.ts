import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
export const ZeroAddress = "0x0000000000000000000000000000000000000000";
export const BI_ZERO = BigInt.fromI32(0);
export const BD_ZERO = BigDecimal.fromString('0');
export const DECIMAL30 = BigDecimal.fromString("1000000000000000000000000000000");
export const DECIMAL18 = BigDecimal.fromString("1000000000000000000");
export const C_STAKED_TOKEN = 'stakedToken';
export const C_SYNTHETICS_READER = 'sytheticsReader';
export const C_DATA_STORE = 'dataStore';
export const MAX_PNL_FACTOR_FOR_TRADERS = Bytes.fromHexString(
  "0xab15365d3aa743e766355e2557c230d8f943e195dc84d9b2b05928a07b635ee1"
);