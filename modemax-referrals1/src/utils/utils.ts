import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { EventLog1EventDataStruct } from "../../generated/EventEmitter/EventEmitter";

export function timestampToPeriod(timestamp: BigInt, period: String): BigInt {
  if (period === "total") {
    return BigInt.fromI32(0)
  }
  let delimeter = BigInt.fromI32(0)
  if (period === "daily") delimeter = BigInt.fromI32(86400)
  else if (period === "weekly") delimeter = BigInt.fromI32(86400 * 7)
  else if (period === "hourly") delimeter = BigInt.fromI32(3600)
  return timestamp.div(delimeter).times(delimeter)
}



export function getAddressString(key: string, eventData: EventLog1EventDataStruct): string | null {
  let items = eventData.addressItems.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].key == key) {
      return items[i].value.toHexString();
    }
  }
  return null;
}

export function getAddressItem(key: string, eventData: EventLog1EventDataStruct): Address | null {
  let items = eventData.addressItems.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].key == key) {
      return items[i].value;
    }
  }
  return null;
}

export function getStringItem(key: string, eventData: EventLog1EventDataStruct): string | null {
  let items = eventData.stringItems.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].key == key) {
      return items[i].value;
    }
  }
  return null;
}

export function getUintItem(key: string, eventData: EventLog1EventDataStruct): BigInt {
  let items = eventData.uintItems.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].key == key) {
      return items[i].value;
    }
  }
  return BigInt.fromI32(0);
}

export function getIntItem(key: string, eventData: EventLog1EventDataStruct): BigInt {
  let items = eventData.intItems.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].key == key) {
      return items[i].value;
    }
  }
  return BigInt.fromI32(0);
}