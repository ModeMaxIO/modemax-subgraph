import {BigDecimal, BigInt, log} from "@graphprotocol/graph-ts";
import {ActivityInfo, UserData, UserLiquidity, UserLiquidityEntry, UserLiquidityTotal} from "../generated/schema";
import {
    activityEndTime,
    activityStartTime,
    epoch
} from "./activeConfig";

let ZERO = BigInt.zero();

export function storeActivityInfo(): void {
    let id = epoch.toString()+":"+activityStartTime.toString()+":"+activityEndTime.toString();
    let activity = ActivityInfo.load(id)
    if (activity == null) {
        activity = new ActivityInfo(id)
        activity.startTimestamp = activityStartTime
        activity.endTimestamp = activityEndTime
        activity.epoch = epoch;
        activity.save()
    }
}

//lpDelta: is + or - value
export function storeUserData(
    actionType:string,
    account:string,
    lpDelta:BigInt,
    traderProfitDelta:BigInt,
    tradingVolumeDelta:BigInt,
    timestamp:BigInt
):void{
    // log.error("----storeUserData---input params-----{} {} {} {} {} {}:",[actionType,account,lpDelta.toString(),traderProfitDelta.toString(),tradingVolumeDelta.toString(),timestamp.toString()])
    if(timestamp.ge(BigInt.fromI32(activityStartTime)) && timestamp.le(BigInt.fromI32(activityEndTime))){
        _storeUserDataByType(actionType,account,"total",lpDelta,traderProfitDelta,tradingVolumeDelta,timestamp);
        _storeUserDataByType(actionType,account,"account",lpDelta,traderProfitDelta,tradingVolumeDelta,timestamp);
    }
    if(actionType == "addLiquidity" || actionType=="removeLiquidity"){
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
    let userData = _getOrCreateUserData(account,period,timestamp);

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
    }else if(actionType == "addLiquidity" || actionType=="removeLiquidity"){
        userData.lp = userData.lp.plus(lpDelta);
    }
    userData.save();
}

function saveUserLiquidity(
    account:string,
    lpDelta:BigInt,
    timestamp:BigInt
):void{
    let diffSec = BigInt.fromI32(activityEndTime).minus(timestamp);
    let epochDiffSec = BigInt.fromI32(activityEndTime - activityStartTime);

    let entryId = activityStartTime.toString()+":"+activityEndTime.toString()+":"+account;
    let entryEntity = _getOrCreateUserLiquidityEntry(entryId);

    let id = account+":"+timestamp.toString();
    let lqEntity = _getOrCreateUserLiquidity(id);

    id = account;
    let totalEntity = _getOrCreateUserLiquidityTotal(id);

    lqEntity.sizeDelta = lpDelta;
    lqEntity.balance = totalEntity.lp.plus(lpDelta);
    if(totalEntity.timestamp >= activityStartTime && totalEntity.timestamp<= activityEndTime){
        lqEntity.lpPointsThis = totalEntity.lpPointsThis.plus(lpDelta.times(diffSec));
    }
    if(totalEntity.timestamp < activityStartTime){
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

    lqEntity.save();
    totalEntity.save();
    entryEntity.save();
}

function _getOrCreateUserData(account :string,period:string,timestamp:BigInt):UserData{
    let id = _getId(account,period);
    let entity = UserData.load(id);
    if(entity == null){
        entity = new UserData(id);
        entity.account = account;

        entity.traderProfit = ZERO;
        entity.tradingVolume = ZERO;
        entity.lp = ZERO;

        entity.period = period;
        entity.epoch = epoch;
        entity.timestamp = timestamp.toI32();
    }
    return entity as UserData;
}

function _getOrCreateUserLiquidityEntry(id:string):UserLiquidityEntry{
    let entity = UserLiquidityEntry.load(id);
    if(entity == null){
        entity = new UserLiquidityEntry(id);
        entity.account = "";
        entity.epoch = epoch;
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


function _getId(account:string,period:string):string{
    if(period == "total"){
        return activityStartTime.toString()+":"+activityEndTime.toString()+":"+period;
    }else if(period == "account"){
        return activityStartTime.toString()+":"+activityEndTime.toString()+":"+account;
    }else{
        return activityStartTime.toString()+":"+activityEndTime.toString();
    }
}



function _div(a:BigInt,b:BigInt):BigDecimal{
    if(b.isZero() || a.isZero()){
        return BigDecimal.zero();
    }else{
        return a.divDecimal(b.toBigDecimal());
    }
}
