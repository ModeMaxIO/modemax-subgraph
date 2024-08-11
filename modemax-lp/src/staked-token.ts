import { ethereum } from '@graphprotocol/graph-ts';
import { dataSource } from '@graphprotocol/graph-ts'
import { createStakedTokenBundle } from './schema-helper';

export function handleOnce(block: ethereum.Block): void {
  createStakedTokenBundle(dataSource.address());
}