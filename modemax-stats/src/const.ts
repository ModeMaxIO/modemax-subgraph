import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const BI_ZERO = BigInt.fromI32(0);
export const BD_ZERO = BigDecimal.fromString('0');
export const BI_ONE = BigInt.fromI32(1);
export const DECIMAL30 = BigDecimal.fromString("1000000000000000000000000000000");
export const DECIMAL18 = BigDecimal.fromString("1000000000000000000");

export const FUNDING_PRECISION = BigInt.fromI32(1000000)
export const BASIS_POINTS_DIVISOR = BigInt.fromI32(10000)
export const LIQUIDATOR_ADDRESS = '0x44311c91008dde73de521cd25136fd37d616802c';

export const TRADE_TYPES = new Array<string>(5)
TRADE_TYPES[0] = 'margin'
TRADE_TYPES[1] = 'swap'
TRADE_TYPES[2] = 'mint'
TRADE_TYPES[3] = 'burn'
TRADE_TYPES[4] = 'liquidation'
TRADE_TYPES[5] = 'marginAndLiquidation'

// actionsMapping
export const ActionSellUSDG = 'SellUSDG'
export const ActionSwap = 'Swap'
export const ActionCreateIncreasePosition = 'CreateIncreasePosition'
export const ActionCreateDecreasePosition = 'CreateDecreasePosition'
export const ActionCancelIncreasePosition = 'CancelIncreasePosition'
export const ActionCancelDecreasePosition = 'CancelDecreasePosition'
export const ActionIncreasePositionLong = 'IncreasePosition-Long'
export const ActionIncreasePositionShort = 'IncreasePosition-Short'
export const ActionDecreasePositionLong = 'DecreasePosition-Long'
export const ActionDecreasePositionShort = 'DecreasePosition-Short'
export const ActionLiquidatePositionLong = 'LiquidatePosition-Long'
export const ActionLiquidatePositionShort = 'LiquidatePosition-Short'
export const ActionExecuteIncreaseOrder = 'ExecuteIncreaseOrder'
export const ActionExecuteDecreaseOrder = 'ExecuteDecreaseOrder'
export const ActionCreateIncreaseOrder = 'CreateIncreaseOrder'
export const ActionCancelIncreaseOrder = 'CancelIncreaseOrder'
export const ActionUpdateIncreaseOrder = 'UpdateIncreaseOrder'
export const ActionCreateDecreaseOrder = 'CreateDecreaseOrder'
export const ActionCancelDecreaseOrder = 'CancelDecreaseOrder'
export const ActionUpdateDecreaseOrder = 'UpdateDecreaseOrder'
export const ActionExecuteSwapOrder = 'ExecuteSwapOrder'
export const ActionCreateSwapOrder = 'CreateSwapOrder'
export const ActionUpdateSwapOrder = 'UpdateSwapOrder'
export const ActionCancelSwapOrder = 'CancelSwapOrder'