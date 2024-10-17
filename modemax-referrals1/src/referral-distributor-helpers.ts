import { Address } from "@graphprotocol/graph-ts"
import { ERC20 } from "../generated/ReferralDistributor/ERC20";
import { Token } from "../generated/schema";

export function fetchTokenDecimals(tokenAddr: Address): i32 {
  let contract = ERC20.bind(tokenAddr)
  let decimalValue = 18
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return decimalValue
}

export function loadOrCreateToken(tokenAddr: string): Token {
  let token = Token.load(tokenAddr);
  if (!token) {
    token = new Token(tokenAddr);
    token.decimals = fetchTokenDecimals(Address.fromString(tokenAddr));
  }
  token.save();
  return token;
}