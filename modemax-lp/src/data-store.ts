import { ethereum } from '@graphprotocol/graph-ts';
import { dataSource } from '@graphprotocol/graph-ts'
import { createDataStore } from './schema-helper';

export function handleOnce(block: ethereum.Block): void {
  createDataStore(dataSource.address());
}