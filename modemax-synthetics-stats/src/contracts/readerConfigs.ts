import { Address, log } from "@graphprotocol/graph-ts";

class ReaderContractConfig {
  public readerContractAddress: Address;
  public dataStoreAddress: Address;
  constructor(readerContractAddress: string, dataStoreAddress: string, public blockNumber: i32) {
    this.readerContractAddress = Address.fromString(readerContractAddress);
    this.dataStoreAddress = Address.fromString(dataStoreAddress);
  }
}

let readerContractByNetwork = new Map<string, ReaderContractConfig>();

//mode
readerContractByNetwork.set(
    // testnet
    // "mode",
    // new ReaderContractConfig(
    //     "0x510823906c935599F338E1df8a49A5120CdC3Da1",//SyntheticsReader
    //     "0xdC09Bea635Fb0C63a38d6B7f3edfCb7DfB59326E", //DataStore
    //     14133022 + 1 //readerContractAddress blockNumber
    // ),
    // mainnet
    "mode",
    new ReaderContractConfig(
        "0x1773953F5d9aD46aaEBD4870A3491c3fFc6d38f4",//SyntheticsReader
        "0x3737Af56b945A0F25F0330E03B9327a977DBB400", //DataStore
        10690185 + 1 //readerContractAddress blockNumber
    )
);

export function getReaderContractConfigByNetwork(network: string): ReaderContractConfig {
  let contract = readerContractByNetwork.get(network);
  if (!contract) {
    log.warning("Contract address not found for network {}", [network]);
    throw new Error("Contract address not found for network");
  }

  return contract;
}
