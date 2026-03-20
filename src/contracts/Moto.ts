import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    Blockchain,
    BytesWriter,
    Calldata,
    Revert,
    SafeMath,
    StoredBoolean,
    ABIDataTypes,
} from '@btc-vision/btc-runtime/runtime';
import { AdministeredOP20 } from './AdministeredOP20';

@final
export class Moto extends AdministeredOP20 {
    private readonly airdropDisabled: StoredBoolean = new StoredBoolean(
        Blockchain.nextPointer,
        false,
    );

    constructor() {
        // 1 billion MOTO tokens with 18 decimals
        super(u256.fromString('1000000000000000000000000000'), 18, 'Motoswap', 'MOTO');
    }

    public override onUpdate(_calldata: Calldata): void {
        super.onUpdate(_calldata);
    }

    @method()
    @returns()
    public disableAirdrops(_calldata: Calldata): BytesWriter {
        this.onlyDeployer(Blockchain.tx.sender);

        this.airdropDisabled.value = true;

        return new BytesWriter(0);
    }

    @method(
        { name: 'addresses', type: ABIDataTypes.ARRAY_OF_ADDRESSES },
        { name: 'amounts', type: ABIDataTypes.ARRAY_OF_UINT32 },
    )
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public airdrop(calldata: Calldata): BytesWriter {
        if (this.airdropDisabled.value === true) {
            throw new Revert('Airdrop is disabled.');
        }

        this.onlyDeployer(Blockchain.tx.sender);

        const MOTO_SCALE: u256 = u256.fromString('10000000000000000'); // Up to 2 decimal. Change to 1000000000000000000 for no decimal precision on airdrop.
        const addresses: Address[] = calldata.readAddressArray();
        const amounts: u32[] = calldata.readU32Array();

        const len: i32 = addresses.length;
        if (len !== amounts.length) {
            throw new Revert('Airdrop: length mismatch');
        }

        for (let i: i32 = 0; i < len; i++) {
            const addr: Address = addresses[i];
            const moto: u32 = unchecked(amounts[i]);

            if (moto <= 0) {
                throw new Revert('Airdrop: amount must be greater than 0');
            }

            const motoToMint: u256 = SafeMath.mul(u256.fromU32(moto), MOTO_SCALE);

            this._mint(addr, motoToMint);
        }

        const writer: BytesWriter = new BytesWriter(1);
        writer.writeBoolean(true);
        return writer;
    }
}
