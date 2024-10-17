import { BigInt } from "@graphprotocol/graph-ts"
import { getDayId, getHourId } from "./utils"
import { GlpStat, HourlyGlpStat } from "../generated/schema"
import { BI_ZERO } from "./const"


export function storeGlpStat(
  timestamp: BigInt,
  glpSupply: BigInt,
  aumInUsdg: BigInt
): void {
  let deprecatedId = getHourId(timestamp)
  let deprecatedEntity = HourlyGlpStat.load(deprecatedId)

  if (deprecatedEntity == null) {
    deprecatedEntity = new HourlyGlpStat(deprecatedId)
    deprecatedEntity.glpSupply = BI_ZERO
    deprecatedEntity.aumInUsdg = BI_ZERO
  }

  deprecatedEntity.aumInUsdg = aumInUsdg
  deprecatedEntity.glpSupply = glpSupply

  deprecatedEntity.save()

  //

  let id = getDayId(timestamp)
  let totalEntity = loadOrCreateGlpStat('total', 'total')
  totalEntity.aumInUsdg = aumInUsdg
  totalEntity.glpSupply = glpSupply
  totalEntity.save()

  let entity = loadOrCreateGlpStat(id, 'daily')
  entity.aumInUsdg = aumInUsdg
  entity.glpSupply = glpSupply
  entity.save()
}

function loadOrCreateGlpStat(id: string, period: string): GlpStat {
  let entity = GlpStat.load(id)
  if (entity == null) {
    entity = new GlpStat(id)
    entity.period = period
    entity.glpSupply = BI_ZERO
    entity.aumInUsdg = BI_ZERO
    entity.distributedEth = BI_ZERO
    entity.distributedEthCumulative = BI_ZERO
    entity.distributedUsd = BI_ZERO
    entity.distributedUsdCumulative = BI_ZERO
    entity.distributedEsgmx = BI_ZERO
    entity.distributedEsgmxCumulative = BI_ZERO
    entity.distributedEsgmxUsd = BI_ZERO
    entity.distributedEsgmxUsdCumulative = BI_ZERO
    // entity.timestamp = timestamp
  }
  return entity as GlpStat
}