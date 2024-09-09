import { EventLog1EventDataStruct } from "../generated/EventEmitter/EventEmitter";
import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { _getDayId, _getMonthId, _getWeekId } from "./helpers";
import { getIntItem, getUintItem } from "./eventLog1Data";
import { LeaderboardData } from "../generated/schema";
import { EPOCH_END_TIME, EPOCH_START_TIME } from "./airdrop";

let ZERO = BigInt.zero();

// for CP
export function storeLeaderboardV2(
    account: string,
    actionType: string,
    eventData: EventLog1EventDataStruct,
    lp: BigInt,
    timestamp: BigInt,
): void {
    if (timestamp.ge(EPOCH_START_TIME) && timestamp.le(EPOCH_END_TIME)) {
        _storeLeaderboardByTypeV2(account, actionType, "total", eventData, lp, timestamp);
        _storeLeaderboardByTypeV2(account, actionType, "weekly", eventData, lp, timestamp);
        _storeLeaderboardByTypeV2(account, actionType, "monthly", eventData, lp, timestamp);
    }
}

// for NLP
export function storeLeaderboard(
    account: string,
    actionType: string,
    delta: BigInt,
    collateraltDelta: BigInt,
    timestamp: BigInt,
): void {
    _storeLeaderboardByType(account, actionType, delta, "total", collateraltDelta, timestamp);
    _storeLeaderboardByType(account, actionType, delta, "weekly", collateraltDelta, timestamp);
    _storeLeaderboardByType(account, actionType, delta, "monthly", collateraltDelta, timestamp);
}

function _storeLeaderboardByTypeV2(
    account: string,
    actionType: string,
    period: string,
    eventData: EventLog1EventDataStruct,
    lp: BigInt,
    timestamp: BigInt,
): void {
    if (period == "daily") {
        timestamp = BigInt.fromString(_getDayId(timestamp));
    } else if (period == "weekly") {
        timestamp = BigInt.fromString(_getWeekId(timestamp));
    } else if (period == "monthly") {
        timestamp = BigInt.fromString(_getMonthId(timestamp));
    }

    let totalId = "total" + ':' + account;
    let id = ""
    if (period == "total") {
        id = totalId;
    } else {
        id = period + ':' + timestamp.toString() + ':' + account
    }

    let leaderBoardDataTotal = _getOrCreateLeaderboardData(totalId, account, period, timestamp);
    let leaderBoardData = _getOrCreateLeaderboardData(id, account, period, timestamp);

    let sizeDeltaUsd = ZERO;
    let netProfit = ZERO;
    let collateralAmountDelta = ZERO;
    let collateralTokenPriceMin = ZERO;
    let collateralTokenPriceMax = ZERO;

    if (actionType != "liquidity") {
        sizeDeltaUsd = getUintItem("sizeDeltaUsd", eventData);
        netProfit = getIntItem("basePnlUsd", eventData);

        collateralTokenPriceMin = getUintItem("collateralTokenPrice.min", eventData);
        collateralTokenPriceMax = getUintItem("collateralTokenPrice.max", eventData);
        let avgPrice = collateralTokenPriceMin.plus(collateralTokenPriceMax).div(BigInt.fromI32(2))
        collateralAmountDelta = getIntItem("collateralDeltaAmount", eventData).times(avgPrice);
    }

    if (actionType == "increasePosition") {
        if (period == "total") {
            leaderBoardData.margin = leaderBoardDataTotal.margin.plus(sizeDeltaUsd);
        } else {
            leaderBoardData.margin = leaderBoardDataTotal.margin;
        }
        leaderBoardData.collateralAmount = leaderBoardData.collateralAmount.plus(collateralAmountDelta);
        leaderBoardData.tradingVolume = leaderBoardData.tradingVolume.plus(sizeDeltaUsd);
        leaderBoardData.netProfit = leaderBoardData.netProfit.plus(netProfit)
    } else if (actionType == "decreasePosition") {
        if (period == "total") {
            leaderBoardData.margin = leaderBoardDataTotal.margin.minus(sizeDeltaUsd);
        } else {
            leaderBoardData.margin = leaderBoardDataTotal.margin;
        }
        leaderBoardData.collateralAmount = leaderBoardData.collateralAmount.minus(collateralAmountDelta);
        leaderBoardData.tradingVolume = leaderBoardData.tradingVolume.plus(sizeDeltaUsd);
        leaderBoardData.netProfit = leaderBoardData.netProfit.plus(netProfit)
    } else if (actionType == "liquidity") {
        if (period == "total") {
            leaderBoardData.liquidity = leaderBoardDataTotal.liquidity.plus(lp);
        } else {
            leaderBoardData.liquidity = leaderBoardDataTotal.liquidity;
        }
    }
    if (leaderBoardData.collateralAmount.equals(ZERO)) {
        leaderBoardData.roi = BigDecimal.zero()
    } else {
        leaderBoardData.roi = leaderBoardData.netProfit.divDecimal(leaderBoardData.collateralAmount.toBigDecimal()).times(BigDecimal.fromString("100"));
    }
    leaderBoardData.save();
}

function _storeLeaderboardByType(
    account: string,
    actionType: string,
    delta: BigInt,
    period: string,
    collateralDelta: BigInt,
    timestamp: BigInt,
): void {

    if (period == "daily") {
        timestamp = BigInt.fromString(_getDayId(timestamp));
    } else if (period == "weekly") {
        timestamp = BigInt.fromString(_getWeekId(timestamp));
    } else if (period == "monthly") {
        timestamp = BigInt.fromString(_getMonthId(timestamp));
    }

    let totalId = "total" + ':' + account;
    let id = ""
    if (period == "total") {
        id = totalId;
    } else {
        id = period + ':' + timestamp.toString() + ':' + account
    }

    let leaderBoardDataTotal = _getOrCreateLeaderboardData(totalId, account, period, timestamp);
    let leaderBoardData = _getOrCreateLeaderboardData(id, account, period, timestamp);

    if (actionType == "increasePosition") {
        if (period == "total") {
            leaderBoardData.margin = leaderBoardDataTotal.margin.plus(delta);
        } else {
            leaderBoardData.margin = leaderBoardDataTotal.margin;
        }
        leaderBoardData.collateralAmount = leaderBoardData.collateralAmount.plus(collateralDelta);
        leaderBoardData.tradingVolume = leaderBoardData.tradingVolume.plus(delta);
    } else if (actionType == "decreasePosition") {
        if (period == "total") {
            leaderBoardData.margin = leaderBoardDataTotal.margin.minus(delta);
        } else {
            leaderBoardData.margin = leaderBoardDataTotal.margin;
        }
        leaderBoardData.collateralAmount = leaderBoardData.collateralAmount.minus(collateralDelta);
        leaderBoardData.tradingVolume = leaderBoardData.tradingVolume.plus(delta);
    } else if (actionType == "updatePosition") {
        leaderBoardData.netProfit = leaderBoardData.netProfit.plus(delta)
    } else if (actionType == "liquidatePosition") {
        leaderBoardData.netProfit = leaderBoardData.netProfit.plus(delta)
    } else if (actionType == "closePosition") {
        leaderBoardData.netProfit = leaderBoardData.netProfit.plus(delta);
    } else if (actionType == "addLiquidity") {
        if (period == "total") {
            leaderBoardData.liquidity = leaderBoardDataTotal.liquidity.plus(delta);
        } else {
            leaderBoardData.liquidity = leaderBoardDataTotal.liquidity;
        }
    } else if (actionType == "removeLiquidity") {
        if (period == "total") {
            leaderBoardData.liquidity = leaderBoardDataTotal.liquidity.minus(delta);
        } else {
            leaderBoardData.liquidity = leaderBoardDataTotal.liquidity;
        }
    }
    if (leaderBoardData.collateralAmount.equals(ZERO)) {
        leaderBoardData.roi = BigDecimal.zero();
    } else {
        leaderBoardData.roi = leaderBoardData.netProfit.divDecimal(leaderBoardData.collateralAmount.toBigDecimal()).times(BigDecimal.fromString("100"));
    }
    leaderBoardData.save();
}

function _getOrCreateLeaderboardData(
    id: string,
    account: string,
    period: string,
    timestamp: BigInt
): LeaderboardData {
    let leaderboardData = LeaderboardData.load(id);
    if (leaderboardData == null) {
        leaderboardData = new LeaderboardData(id);
        leaderboardData.margin = ZERO;
        leaderboardData.tradingVolume = ZERO;
        leaderboardData.netProfit = ZERO;
        leaderboardData.period = period;
        leaderboardData.account = account;
        leaderboardData.liquidity = ZERO;
        leaderboardData.collateralAmount = ZERO;
        leaderboardData.roi = BigDecimal.zero()
        leaderboardData.timestamp = timestamp.toI32()
    }
    return leaderboardData as LeaderboardData;
}
