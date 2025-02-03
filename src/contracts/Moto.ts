import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    AddressMap,
    Blockchain,
    BOOLEAN_BYTE_LENGTH,
    BytesWriter,
    Calldata,
    encodeSelector,
    Selector,
} from '@btc-vision/btc-runtime/runtime';
import { AdministeredOP20 } from './AdministeredOP20';

@final
export class Moto extends AdministeredOP20 {
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

        const writer: BytesWriter = new BytesWriter(BOOLEAN_BYTE_LENGTH);
        writer.writeBoolean(true);

        return writer;
    }
}
