import { ethereum } from '@graphprotocol/graph-ts';
import { dataSource } from '@graphprotocol/graph-ts'
import { createSyntheticsReader } from './schema-helper';

export function handleOnce(block: ethereum.Block): void {
  createSyntheticsReader(dataSource.address());
}