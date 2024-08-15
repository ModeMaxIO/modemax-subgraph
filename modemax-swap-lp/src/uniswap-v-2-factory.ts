import { PairCreated as PairCreatedEvent } from "../generated/UniswapV2Factory/UniswapV2Factory"
import { Pair, PairCreated, Token } from "../generated/schema"
import { UniswapV2Pair as UniswapV2PairTemplate} from "../generated/templates";
import { BD_ZERO } from "./helpers/const";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./helpers/token-helper";

export function handlePairCreated(event: PairCreatedEvent): void {
  let entity = new PairCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token0 = event.params.token0
  entity.token1 = event.params.token1
  entity.pair = event.params.pair
  entity.param3 = event.params.param3

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  UniswapV2PairTemplate.create(event.params.pair);

  let token0 = Token.load(event.params.token0.toHexString());
  let token1 = Token.load(event.params.token1.toHexString());

  if (!token0) {
    token0 = new Token(event.params.token0.toHexString());
    token0.name = fetchTokenName(event.params.token0);
    token0.symbol = fetchTokenSymbol(event.params.token0);
    token0.decimals = fetchTokenDecimals(event.params.token0);
    token0.derivedUSD = BD_ZERO;
    token0.save();
  }

  if (!token1) {
    token1 = new Token(event.params.token1.toHexString());
    token1.name = fetchTokenName(event.params.token1);
    token1.symbol = fetchTokenSymbol(event.params.token1);
    token1.decimals = fetchTokenDecimals(event.params.token1);
    token1.derivedUSD = BD_ZERO;
    token1.save();
  }

  let pair = new Pair(event.params.pair.toHexString())
  pair.token0 = token0.id;
  pair.token1 = token1.id;
  pair.reserve0 = BD_ZERO;
  pair.reserve1 = BD_ZERO;
  pair.totalSupply = BD_ZERO;
  pair.reserveUSD = BD_ZERO;
  pair.save();
}
