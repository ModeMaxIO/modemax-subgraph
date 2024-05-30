import {BigInt, log} from "@graphprotocol/graph-ts";
import {
    AirdropConfig,
    ReferalPositionRaw,
    UserData,
    UserLiquidity,
    UserLiquidityEntry,
    UserLiquidityTotal
} from "../generated/schema";
import {_getDayId, _getEpochTimestampId} from "./helpers";

let ZERO = BigInt.zero();
let EPOCH = BigInt.fromI32(1)
let EPOCH_START_TIME = BigInt.fromI32(1711929600) // UTC 2024-04-01 00:00:00
let EPOCH_END_TIME = BigInt.fromI32(1718063999) // UTC 2024-06-10 23:59:59

//lpDelta: is + or - value
export function storeUserData(
    actionType:string,
    account:string,
    lpDelta:BigInt,
    traderProfitDelta:BigInt,
    tradingVolumeDelta:BigInt,
    timestamp:BigInt
):void{
    _storeAirdropConfig();
    // log.error("###----storeUserData---input params-----{} {} {} {} {} {}:",[actionType,account,lpDelta.toString(),traderProfitDelta.toString(),tradingVolumeDelta.toString(),timestamp.toString()])
    if(timestamp.ge(EPOCH_START_TIME) && timestamp.le(EPOCH_END_TIME)){
        _storeUserDataByType(actionType,account,"total",lpDelta,traderProfitDelta,tradingVolumeDelta,timestamp);
        _storeUserDataByType(actionType,account,"day",lpDelta,traderProfitDelta,tradingVolumeDelta,timestamp);
        _storeUserDataByType(actionType,account,"account",lpDelta,traderProfitDelta,tradingVolumeDelta,timestamp);
    }
    if((actionType == "addLiquidity" || actionType=="removeLiquidity") && timestamp.le(EPOCH_END_TIME)){
        saveUserLiquidity(account,lpDelta,timestamp);
    }
}

function _storeUserDataByType(
    actionType:string,
    account:string,
    period:string,
    lpDelta:BigInt,
    traderProfitDelta:BigInt,
    tradingVolumeDelta:BigInt,
    timestamp:BigInt
):void{
    let _timestamp = EPOCH_START_TIME
    if (period=="day"){
        _timestamp = BigInt.fromString(_getDayId(timestamp))
    }
    let userData = _getOrCreateUserData(account,period,_timestamp);

    if(actionType == "increasePosition"){
        userData.tradingVolume = userData.tradingVolume.plus(tradingVolumeDelta);
        //Just for CP
        userData.traderProfit = userData.traderProfit.plus(traderProfitDelta);
    }else if(actionType == "decreasePosition"){
        userData.tradingVolume = userData.tradingVolume.plus(tradingVolumeDelta);
        //Just for CP
        userData.traderProfit = userData.traderProfit.plus(traderProfitDelta);
    }else if(actionType == "updatePosition"){
        userData.traderProfit = userData.traderProfit.plus(traderProfitDelta);
    }else if(actionType == "liquidatePosition"){
        userData.traderProfit = userData.traderProfit.plus(traderProfitDelta);
    }else if(actionType == "closePosition"){
        userData.traderProfit = userData.traderProfit.plus(traderProfitDelta);
    } else if(actionType == "addLiquidity" || actionType=="removeLiquidity"){
        userData.lp = userData.lp.plus(lpDelta);
    }else if(actionType == "referralIncreasePosition" || actionType == "referralDecreasePosition"){
        userData.referral = userData.referral.plus(tradingVolumeDelta);
    }
    userData.save();
}

function saveUserLiquidity(
    account:string,
    lpDelta:BigInt,
    timestamp:BigInt
):void{
    let activityStartTime = EPOCH_START_TIME
    let activityEndTime = EPOCH_END_TIME

    let diffSec = activityEndTime.minus(timestamp);
    let epochDiffSec = activityEndTime.minus(activityStartTime)

    let entryId = activityStartTime.toString()+":"+account;
    let entryEntity = _getOrCreateUserLiquidityEntry(entryId);

    let id = account+":"+timestamp.toString();
    let lqEntity = _getOrCreateUserLiquidity(id);

    id = account;
    let totalEntity = _getOrCreateUserLiquidityTotal(id);

    lqEntity.sizeDelta = lpDelta;
    lqEntity.balance = totalEntity.lp.plus(lpDelta);
    if(totalEntity.timestamp >= activityStartTime.toI32() && totalEntity.timestamp<= activityEndTime.toI32()){
        lqEntity.lpPointsThis = totalEntity.lpPointsThis.plus(lpDelta.times(diffSec));
    }
    if(totalEntity.timestamp < activityStartTime.toI32()){
        lqEntity.lpPointsThis = totalEntity.lp.times(epochDiffSec).plus(lpDelta.times(diffSec)) ;
    }
    lqEntity.lpPointsNext = lqEntity.balance.times(epochDiffSec);
    lqEntity.account = account;
    lqEntity.timestamp = timestamp.toI32();
    lqEntity.userLiquidityEntry = entryId;

    totalEntity.lp = lqEntity.balance;
    totalEntity.account = account;
    totalEntity.lpPointsThis = lqEntity.lpPointsThis;
    totalEntity.timestamp = timestamp.toI32();

    entryEntity.account = account;
    entryEntity.timestamp = activityStartTime.toI32();

    lqEntity.save();
    totalEntity.save();
    entryEntity.save();
}

function _getOrCreateUserData(account :string,period:string,timestamp:BigInt):UserData{
    let id = ""
    if(period == "total"){
        id = "total:"+timestamp.toString();
    }else if(period == "account"){
        id = "account:"+timestamp.toString()+":"+account;
    }else if(period == "day"){
        id = "day:"+timestamp.toString()+":"+account;
    }
    let entity = UserData.load(id);
    if(entity == null){
        entity = new UserData(id);
        entity.account = account;

        entity.traderProfit = ZERO;
        entity.tradingVolume = ZERO;
        entity.lp = ZERO;
        entity.referral = ZERO;

        entity.period = period;
        entity.timestamp = timestamp.toI32();
    }
    return entity as UserData;
}

function _getOrCreateUserLiquidityEntry(id:string):UserLiquidityEntry{
    let entity = UserLiquidityEntry.load(id);
    if(entity == null){
        entity = new UserLiquidityEntry(id);
        entity.account = "";
        entity.timestamp = ZERO.toI32();
    }
    return entity as UserLiquidityEntry;
}

function _getOrCreateUserLiquidity(id:string):UserLiquidity{
    let entity = UserLiquidity.load(id);
    if(entity == null){
        entity = new UserLiquidity(id);
        entity.account = "";
        entity.balance= ZERO;
        entity.sizeDelta = ZERO;
        entity.lpPointsThis = ZERO;
        entity.lpPointsNext = ZERO;
        entity.timestamp = ZERO.toI32();
        entity.userLiquidityEntry = "";
    }
    return entity as UserLiquidity;
}

function _getOrCreateUserLiquidityTotal(id:string):UserLiquidityTotal{
    let entity = UserLiquidityTotal.load(id);
    if(entity == null){
        entity = new UserLiquidityTotal(id);
        entity.account = "";
        entity.lp= ZERO;
        entity.lpPointsThis = ZERO;
        entity.timestamp = ZERO.toI32();
    }
    return entity as UserLiquidityTotal;
}

function _storeAirdropConfig(): void {
    let id = EPOCH.toString()+":"+EPOCH_START_TIME.toString()+":"+EPOCH_END_TIME.toString();
    let activity = AirdropConfig.load(id)
    if (activity == null) {
        activity = new AirdropConfig(id)
        activity.startTimestamp = EPOCH_START_TIME.toI32()
        activity.endTimestamp = EPOCH_END_TIME.toI32()
        activity.epoch = EPOCH.toI32();
        activity.save()
    }
}

export function saveReferalPositionRaw(id: string,
                                       account: string,
                                       affiliate:string,
                                       referralCode:string,
                                       isIncrease:boolean,
                                       volume:BigInt,
                                       timestamp: BigInt,
                                       version:string):void{
    let entity = new ReferalPositionRaw(id);
    entity.account = account;
    entity.affiliate =affiliate;
    entity.referralCode = referralCode;
    entity.isIncrease = isIncrease;
    entity.volume = volume;
    entity.timestamp = timestamp;
    entity.version = version;
    entity.save();
}