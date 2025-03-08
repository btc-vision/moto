import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    AddressMap,
    Blockchain,
    BOOLEAN_BYTE_LENGTH,
    BytesWriter,
    Calldata,
} from '@btc-vision/btc-runtime/runtime';
import { AdministeredOP20 } from './AdministeredOP20';

@final
export class Moto extends AdministeredOP20 {
    constructor() {
        super(u256.fromU64(2_100_000_000_000_000), 8, 'Moto', 'MOTO');
    }

    /**
     * Mints tokens to the specified address.
     *
     * @param calldata Calldata containing an `Address` and a `u256` to mint to.
     */
    private _optimizedMint(address: Address, amount: u256): void {
        this.balanceOfMap.set(address, amount);
        this._totalSupply.addNoCommit(amount);

        this.createMintEvent(address, amount);
    }

    /**
     * Mints tokens to the specified addresses.
     *
     * @param calldata Calldata containing an `AddressMap<Address, u256>` to mint to.
     */
    @method('airdrop', {
        name: 'addressAndAmount',
        type: 'tuple(address,uint256)',
    })
    @returns('bool')
    public airdrop(calldata: Calldata): BytesWriter {
        this.onlyDeployer(Blockchain.tx.sender);

        const addressAndAmount: AddressMap<u256> = calldata.readAddressMapU256();

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
