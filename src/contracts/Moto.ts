import { u256 } from 'as-bignum/assembly';
import { BytesWriter, Calldata, OP_20, Selector } from '@btc-vision/btc-runtime/runtime';

@final
export class Moto extends OP_20 {
    public readonly decimals: u8 = 8;

    public readonly name: string = 'Moto';
    public readonly symbol: string = 'MOTO';

    //private readonly currentSupply: u256 = u256.fromU64(13_337_000);

    constructor() {
        super(u256.fromU64(2100000000000000));
    }

    public override callMethod(method: Selector, calldata: Calldata): BytesWriter {
        switch (method) {
            default:
                return super.callMethod(method, calldata);
        }
    }
}
