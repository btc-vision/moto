import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    AddressMap,
    Blockchain,
    BytesWriter,
    Calldata,
    encodeSelector,
    OP_20,
    Selector,
} from '@btc-vision/btc-runtime/runtime';

@final
export class Moto extends OP_20 {
    public constructor() {
        super(u256.fromU64(2_100_000_000_000_000), 8, 'Moto', 'MOTO');
    }

    public override execute(method: Selector, calldata: Calldata): BytesWriter {
        switch (method) {
            case encodeSelector('airdrop'):
                return this.airdrop(calldata);
            default:
                return super.execute(method, calldata);
        }
    }

    private _optimizedMint(address: Address, amount: u256): void {
        this.balanceOfMap.set(address, amount);
        this._totalSupply.addNoCommit(amount);

        this.createMintEvent(address, amount);
    }

    private airdrop(calldata: Calldata): BytesWriter {
        this.onlyDeployer(Blockchain.tx.sender);

        const addressAndAmount: AddressMap<u256> = calldata.readAddressValueTuple();

        const addresses: Address[] = addressAndAmount.keys();
        for (let i: i32 = 0; i < addresses.length; i++) {
            const address = addresses[i];
            const amount = addressAndAmount.get(address);

            this._optimizedMint(address, amount);
        }

        this._totalSupply.commit();

        const writer: BytesWriter = new BytesWriter(1);
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
