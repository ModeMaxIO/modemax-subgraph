import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { EventLog1EventDataStruct } from "../generated/EventEmitter/EventEmitter";
import { loadDataStore, loadSyntheticsReader } from "./schema-helper";
import { BI_ZERO, MAX_PNL_FACTOR_FOR_TRADERS } from "./const";
import { Reader__getMarketTokenPriceInputIndexTokenPriceStruct, Reader__getMarketTokenPriceInputLongTokenPriceStruct, Reader__getMarketTokenPriceInputMarketStruct, Reader__getMarketTokenPriceInputShortTokenPriceStruct, Reader as ReaderContract } from "../generated/EventEmitter/Reader";
import { MarketPrice, MarketPriceSnap, MarketToken, TokenPrice } from "../generated/schema";

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


// Get the current market token price if the timestamp is 0.
// Get the market token price at the specified timestamp.
export function getMarketTokenPrice(market: string, timestamp: i32): BigInt {
    const marketPriceSnapId = market.concat(':').concat(timestamp.toString());
    let marketPriceSnap = MarketPriceSnap.load(marketPriceSnapId)
    if (marketPriceSnap) {
        return marketPriceSnap.price;
    }
    if (timestamp == 0) {
        const marketPrice = loadOrCreateMarketTokenPrice(market);
        if (marketPrice.price.gt(BI_ZERO)) {
            return marketPrice.price;
        }
    }
    const readerBundle = loadSyntheticsReader();
    if (!readerBundle) {
        return BI_ZERO;
    }

    const dataStoreBundle = loadDataStore();
    if (!dataStoreBundle) {
        return BI_ZERO;
    }

    const marketToken = MarketToken.load(market);
    if (!marketToken) {
        return BI_ZERO;
    }

    const reader = ReaderContract.bind(Address.fromBytes(readerBundle.address));
    const marketArg = new Reader__getMarketTokenPriceInputMarketStruct(4);
    marketArg[0] = ethereum.Value.fromAddress(Address.fromString(marketToken.id));
    marketArg[1] = ethereum.Value.fromAddress(Address.fromString(marketToken.indexToken));
    marketArg[2] = ethereum.Value.fromAddress(Address.fromString(marketToken.longToken));
    marketArg[3] = ethereum.Value.fromAddress(Address.fromString(marketToken.shortToken));

    const indexTokenPriceArg = new Reader__getMarketTokenPriceInputIndexTokenPriceStruct(2);
    {
        const tokenPrice = TokenPrice.load(marketToken.indexToken);
        if (!tokenPrice) {
            return BI_ZERO;
        }
        indexTokenPriceArg[0] = ethereum.Value.fromUnsignedBigInt(tokenPrice.minPrice);
        indexTokenPriceArg[1] = ethereum.Value.fromUnsignedBigInt(tokenPrice.maxPrice);
    }
    const longTokenPriceArg = new Reader__getMarketTokenPriceInputLongTokenPriceStruct(2);
    {
        const tokenPrice = TokenPrice.load(marketToken.longToken);
        if (!tokenPrice) {
            return BI_ZERO;
        }
        longTokenPriceArg[0] = ethereum.Value.fromUnsignedBigInt(tokenPrice.minPrice);
        longTokenPriceArg[1] = ethereum.Value.fromUnsignedBigInt(tokenPrice.maxPrice);
    }
    const shortTokenPriceArg = new Reader__getMarketTokenPriceInputShortTokenPriceStruct(2);
    {
        const tokenPrice = TokenPrice.load(marketToken.shortToken);
        if (!tokenPrice) {
            return BI_ZERO;
        }
        shortTokenPriceArg[0] = ethereum.Value.fromUnsignedBigInt(tokenPrice.minPrice);
        shortTokenPriceArg[1] = ethereum.Value.fromUnsignedBigInt(tokenPrice.maxPrice);
    }

    const result = reader.try_getMarketTokenPrice(
        Address.fromBytes(dataStoreBundle.address),
        marketArg,
        indexTokenPriceArg,
        longTokenPriceArg,
        shortTokenPriceArg,
        MAX_PNL_FACTOR_FOR_TRADERS,
        true
    )
    if (result.reverted) {
        return BI_ZERO;
    }
    marketPriceSnap = new MarketPriceSnap(marketPriceSnapId);
    marketPriceSnap.price = result.value.value0;
    marketPriceSnap.timestamp = timestamp;
    marketPriceSnap.save();
    const marketPrice = loadOrCreateMarketTokenPrice(market);
    marketPrice.price = marketPriceSnap.price;
    marketPrice.timestamp = timestamp;
    marketPrice.save();
    return result.value.value0;
}

function loadOrCreateMarketTokenPrice(market: string): MarketPrice {
    let id = market;
    let marketPrice = MarketPrice.load(id);
    if (!marketPrice) {
        marketPrice = new MarketPrice(id);
        marketPrice.price = BI_ZERO;
        marketPrice.timestamp = 0;
        marketPrice.save();
    }
    return marketPrice;
}