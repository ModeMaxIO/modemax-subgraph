import { BigInt, BigDecimal, Address, Bytes } from '@graphprotocol/graph-ts'
import { Approval, Transfer } from '../types/ZKF/ERC20'
import { Block } from '../types/schema'
export function handleApprove(event: Approval): void {
    saveBlock(event.block.hash, event.block.number, event.block.timestamp)
}

export function handleTransfer(event: Approval): void {
    saveBlock(event.block.hash, event.block.number, event.block.timestamp)
}

function saveBlock(hash: Bytes, number: BigInt, timestamp: BigInt): void {
    let id = hash.toHex()
    let blockEntity = Block.load(id)
    if (blockEntity === null) {
        blockEntity = new Block(id)
        blockEntity.number = number
        blockEntity.timestamp = timestamp
        blockEntity.save()
    }
}