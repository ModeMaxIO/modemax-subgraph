import { Address, BigInt } from "@graphprotocol/graph-ts";
import { IERC20 } from "../../generated/UniswapV2Factory/IERC20";

export function fetchTokenName(tokenAddr: Address): string  {
  let contract = IERC20.bind(tokenAddr)
  let nameValue = 'unkown'
  let nameResult = contract.try_name()
  if (!nameResult.reverted) {
    nameValue = nameResult.value
  }
  return nameValue
}
export function fetchTokenSymbol(tokenAddr: Address): string  {
  let contract = IERC20.bind(tokenAddr)
  let symbolValue = 'unkown'
  let symbolResult = contract.try_name()
  if (!symbolResult.reverted) {
    symbolValue = symbolResult.value
  }
  return symbolValue
}

export function fetchTokenDecimals(tokenAddr: Address): i32 {
  let contract = IERC20.bind(tokenAddr)
  let decimalValue = 18
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return decimalValue
}

