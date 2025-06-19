import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    ADDRESS_BYTE_LENGTH,
    Blockchain,
    BOOLEAN_BYTE_LENGTH,
    BytesWriter,
    Calldata,
    OP20,
    OP20InitParameters,
    Revert,
    SafeMath,
    StoredAddress,
} from '@btc-vision/btc-runtime/runtime';

export abstract class AdministeredOP20 extends OP20 {
    protected _admin: StoredAddress;

    constructor(
        private __maxSupply: u256,
        private __decimals: u8,
        private __name: string,
        private __symbol: string,
    ) {
        super();

        this._admin = new StoredAddress(Blockchain.nextPointer);
    }

    public onDeployment(_calldata: Calldata): void {
        this.instantiate(
            new OP20InitParameters(this.__maxSupply, this.__decimals, this.__name, this.__symbol),
        );

        this._admin.value = this.contractDeployer;
    }

    /**
     * Returns the current admin of the contract.
     *
     * @param _calldata Empty calldata.
     */
    @method()
    @returns('address')
    public admin(_calldata: Calldata): BytesWriter {
        const response = new BytesWriter(ADDRESS_BYTE_LENGTH);
        response.writeAddress(this._admin.value);

        return response;
    }

    /**
     * Throws if the caller is not the admin.
     */
    protected onlyAdmin(): void {
        if (!Blockchain.tx.sender.equals(this._admin.value)) {
            throw new Revert('Only admin can call this method');
        }
    }

    /**
     * Changes the contract admin.
     * Only callable by the current deployer.
     *
     * @param calldata Calldata containing an `Address` to change the admin to.
     */
    @method('changeAdmin', {
        name: 'to',
        type: ABIDataTypes.ADDRESS,
    })
    @returns('bool')
    public changeAdmin(calldata: Calldata): BytesWriter {
        this.onlyDeployer(Blockchain.tx.sender);

        const to = calldata.readAddress();

        this._admin.value = to;

        const response = new BytesWriter(BOOLEAN_BYTE_LENGTH);
        response.writeBoolean(true);

        return response;
    }

    /**
     * Allows the admin to mint tokens.
     * This is different from `mint` which allows the owner to mint tokens.
     * The intended use case is for this token to be managed by some admin (or admin smart contract in our case).
     *
     * @param calldata Calldata containing an `Address` to mint to and a `u256` amount of tokens to mint.
     *
     * @throws if the caller is not the admin or if the amount exceeds `totalSupply` or is 0.
     */
    @method(
        'adminMint',
        {
            name: 'to',
            type: ABIDataTypes.ADDRESS,
        },
        {
            name: 'amount',
            type: ABIDataTypes.UINT256,
        },
    )
    @returns('bool')
    public adminMint(calldata: Calldata): BytesWriter {
        this.onlyAdmin();

        const to = calldata.readAddress();
        const amount = calldata.readU256();

        if (amount == u256.Zero) {
            throw new Revert("Can't mint 0 tokens.");
        }

        if (!this.balanceOfMap.has(to)) {
            this.balanceOfMap.set(to, amount);
        } else {
            const prevBalance = this.balanceOfMap.get(to);
            const newBalance = SafeMath.add(prevBalance, amount);

            this.balanceOfMap.set(to, newBalance);
        }

        this._totalSupply.add(amount);

        // TODO: Can be more useful in the future if this contract is moved up to a more generic standard
        // Right now this is used for tokens where maxSupply is u256.Max, so this kind of error would be caught above.
        if (this._totalSupply.value > this.maxSupply) {
            throw new Revert('Max supply exceeded.');
        }

        this.createMintEvent(to, amount);

        const response = new BytesWriter(BOOLEAN_BYTE_LENGTH);
        response.writeBoolean(true);

        return response;
    }

    /**
     * Transfers tokens from a given address to the dead address, burning them without affecting total supply.
     * DOES NOT require the address to burn from to have given the admin approval to spend the burn amount.
     *
     * @param calldata Calldata containing an `Address` to burn from and a `u256` amount to burn.
     *
     * @throws if the caller is not the admin or if the amount is 0.
     */
    @method(
        'adminBurn',
        {
            name: 'from',
            type: ABIDataTypes.ADDRESS,
        },
        {
            name: 'amount',
            type: ABIDataTypes.UINT256,
        },
    )
    @returns('bool')
    public adminBurn(calldata: Calldata): BytesWriter {
        this.onlyAdmin();

        const from = calldata.readAddress();
        const amount = calldata.readU256();

        this._adminBurn(from, amount);

        this.createBurnEvent(amount);

        const response = new BytesWriter(BOOLEAN_BYTE_LENGTH);
        response.writeBoolean(true);

        return response;
    }

    /**
     * Transfers tokens from a given address to the dead address, burning them without affecting total supply.
     * DOES NOT require the address to burn from to have given the admin approval to spend the burn amount.
     *
     * @param from The address to burn from.
     * @param amount The amount to burn.
     *
     * @throws if the caller is not the admin, if the amount is 0, or if the amount exceeds the balance of the `from` address.
     */
    protected _adminBurn(from: Address, amount: u256): void {
        const balance = this.balanceOfMap.get(from);

        if (amount == u256.Zero) {
            throw new Revert("Can't burn 0 tokens.");
        }

        if (amount > balance) {
            throw new Revert("Can't burn more than owned.");
        }

        this.balanceOfMap.set(from, SafeMath.sub(balance, amount));
        this._totalSupply.value = SafeMath.sub(this.totalSupply, amount);
    }
}
