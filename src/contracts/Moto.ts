import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    AddressMap,
    Blockchain,
    BOOLEAN_BYTE_LENGTH,
    BytesWriter,
    Calldata,
    SafeMath,
} from '@btc-vision/btc-runtime/runtime';
import { AdministeredOP20 } from './AdministeredOP20';

@final
export class Moto extends AdministeredOP20 {
    constructor() {
        // Max Supply: 1 billion
        super(u256.fromString('1000000000000000000000000000'), 18, 'Motoswap', 'MOTO');
    }

    /**
     * Mints tokens to the specified addresses.
     *
     * @param calldata Calldata containing an `AddressMap<Address, u256>` to mint to.
     */
    @method('airdrop', {
        name: 'addressAndAmount',
        type: ABIDataTypes.ADDRESS_UINT256_TUPLE,
    })
    @returns({
        name: 'success',
        type: ABIDataTypes.BOOL,
    })
    @emit('Mint')
    public airdrop(calldata: Calldata): BytesWriter {
        this.onlyDeployer(Blockchain.tx.sender);

        const addressAndAmount: AddressMap<u256> = calldata.readAddressMapU256();
        const addresses: Address[] = addressAndAmount.keys();

        let totalAirdropped: u256 = u256.Zero;

        for (let i: i32 = 0; i < addresses.length; i++) {
            const address = addresses[i];
            const amount = addressAndAmount.get(address);

            const currentBalance: u256 = this.balanceOfMap.get(address);

            if (currentBalance) {
                this.balanceOfMap.set(address, SafeMath.add(currentBalance, amount));
            } else {
                this.balanceOfMap.set(address, amount);
            }

            totalAirdropped = SafeMath.add(totalAirdropped, amount);

            this.createMintEvent(address, amount);
        }

        this._totalSupply.set(SafeMath.add(this._totalSupply.value, totalAirdropped));

        const writer: BytesWriter = new BytesWriter(BOOLEAN_BYTE_LENGTH);
        writer.writeBoolean(true);

        return writer;
    }
}
