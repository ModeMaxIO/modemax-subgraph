import {
  Address,
  BigInt,
} from "@graphprotocol/graph-ts"

// Initialize a Token Definition with the attributes
export class TokenDefinition {
  address : Address
  symbol: string
  name: string
  decimals: BigInt

  // Initialize a Token Definition with its attributes
  constructor(address: Address, symbol: string, name: string, decimals: BigInt) {
    this.address = address
    this.symbol = symbol
    this.name = name
    this.decimals = decimals
  }

  // Get all tokens with a static defintion
  static getStaticDefinitions(): Array<TokenDefinition> {
    let staticDefinitions = new Array<TokenDefinition>(11)

    // Add WUSDC
    let tokenUSDC = new TokenDefinition(
      Address.fromString('0x6e0e4a4994e68cc5d28802cba1dc7ee13b1e9659'),
      'ETH.m',
      'Wrapped ETH',
      BigInt.fromI32(18)
    )
    staticDefinitions.push(tokenUSDC)

    // Add ETH
    let tokenETH = new TokenDefinition(
      Address.fromString('0xc14092d39d4b9034b41b2d00581e8b4cb282611f'),
      'MODE.m',
      'MODE.m',
      BigInt.fromI32(18)
    )
    staticDefinitions.push(tokenETH)

    // Add USDT
    let tokenUSDT = new TokenDefinition(
      Address.fromString('0x1bfa66cb34851b98b5d23cadc554bbb4cba881f6'),
      'USDT.m',
      'USDT.m',
      BigInt.fromI32(6)
    )
    staticDefinitions.push(tokenUSDT)

    // Add WBTC
    let tokenWBTC = new TokenDefinition(
      Address.fromString('0xc7b06f55fbcd31cd691504f3dfc4efa9082616b7'),
      'WETH',
      'Wrapped ETH',
      BigInt.fromI32(8)
    )
    staticDefinitions.push(tokenWBTC)

    return staticDefinitions
  }

  // Helper for hardcoded tokens
  static fromAddress(tokenAddress: Address) : TokenDefinition | null {
    let staticDefinitions = this.getStaticDefinitions()
    let tokenAddressHex = tokenAddress.toHexString()

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i]
      if(staticDefinition.address.toHexString() == tokenAddressHex) {
        return staticDefinition
      }
    }

    // If not found, return null
    return null
  }

}