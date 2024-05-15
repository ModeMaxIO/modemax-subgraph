import {Address, BigInt, log} from "@graphprotocol/graph-ts";
import {EventLog1EventDataStruct} from "../generated/EventEmitter/EventEmitter";

export function getAddressString(key:string,eventData:EventLog1EventDataStruct): string | null{
    let items = eventData.addressItems.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].key == key) {
            return items[i].value.toHexString();
        }
    }
    return null;
}

export function getAddressItem(key:string,eventData:EventLog1EventDataStruct): Address | null{
    let items = eventData.addressItems.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].key == key) {
            return items[i].value;
        }
    }
    return null;
}

export function getStringItem(key: string,eventData:EventLog1EventDataStruct): string | null {
    let items = eventData.stringItems.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].key == key) {
            return items[i].value;
        }
    }
    return null;
}

export function getUintItem(key: string,eventData:EventLog1EventDataStruct): BigInt {
    let items = eventData.uintItems.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].key == key) {
            return items[i].value;
        }
    }
    return BigInt.fromI32(0);
}

export function  getIntItem(key: string,eventData:EventLog1EventDataStruct): BigInt {
    let items = eventData.intItems.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].key == key) {
            return items[i].value;
        }
    }
    return BigInt.fromI32(0);
}