import { u256 } from 'as-bignum/assembly';
import {
    Address,
    Blockchain,
    BytesWriter,
    Calldata,
    encodeSelector,
    Map,
    OP_20,
    Selector,
} from '@btc-vision/btc-runtime/runtime';

@final
export class Moto extends OP_20 {
    constructor() {
        super(u256.fromU64(2100000000000000), 8, 'Moto', 'MOTO');
    }

    public override callMethod(method: Selector, calldata: Calldata): BytesWriter {
        switch (method) {
            case encodeSelector('airdrop'):
                return this.airdrop(calldata);
            case encodeSelector('airdropDefined'):
                return this.airdropDefined(calldata);
            default:
                return super.callMethod(method, calldata);
        }
    }

    private airdrop(calldata: Calldata): BytesWriter {
        const callee = Blockchain.callee();
        this.onlyOwner(callee);

        const drops: Map<Address, u256> = calldata.readAddressValueTuple();

        const addresses: Address[] = drops.keys();
        for (let i: i32 = 0; i < addresses.length; i++) {
            const address = addresses[i];
            const amount = drops.get(address);

            this._mint(address, amount, false);
        }

        const writer: BytesWriter = new BytesWriter();
        writer.writeBoolean(true);

        return writer;
    }

    private airdropDefined(calldata: Calldata): BytesWriter {
        const callee = Blockchain.callee();
        this.onlyOwner(callee);

        const amount = calldata.readU256();
        const amountOfAddresses: u32 = calldata.readU32();
        for (let i: u32 = 0; i < amountOfAddresses; i++) {
            const address = calldata.readAddress();

            this._mint(address, amount, false);
        }

        const writer: BytesWriter = new BytesWriter();
        writer.writeBoolean(true);

        return writer;
    }

    /*private mintNoEvent(to: Address, value: u256): void {
        if (!this.balanceOfMap.has(to)) {
            this.balanceOfMap.set(to, value);
        } else {
            const toBalance: u256 = this.balanceOfMap.get(to);
            const newToBalance: u256 = SafeMath.add(toBalance, value);

            this.balanceOfMap.set(to, newToBalance);
        }

        // @ts-ignore
        this._totalSupply += value;

        if (this._totalSupply.value > this.maxSupply) throw new Revert('Max supply reached');
    }*/
}
