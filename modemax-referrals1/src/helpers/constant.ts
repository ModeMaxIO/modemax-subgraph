import { BigInt } from "@graphprotocol/graph-ts";

export type Version = string;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
export const ZERO = BigInt.fromI32(0);
export const ONE = BigInt.fromI32(1);
export const BASIS_POINTS_DIVISOR = BigInt.fromI32(10000);