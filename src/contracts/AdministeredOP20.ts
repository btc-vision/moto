import {
    Address,
    ADDRESS_BYTE_LENGTH,
    Blockchain,
    BOOLEAN_BYTE_LENGTH,
    BytesWriter,
    Calldata,
    encodeSelector,
    OP_20,
    Revert,
    SafeMath,
    Selector,
    StoredAddress,
} from '@btc-vision/btc-runtime/runtime';
import { u256 } from '@btc-vision/as-bignum/assembly';

export abstract class AdministeredOP20 extends OP_20 {
    protected _admin: StoredAddress;

    public get admin(): Address {
        if (!this._admin.value) throw new Revert('Admin not set');

        return this._admin.value;
    }

    protected constructor(maxSupply: u256, decimals: u8, name: string, symbol: string) {
        super(maxSupply, decimals, name, symbol);
        this._admin = new StoredAddress(Blockchain.nextPointer, new Address());
    }

    public onDeployment(_calldata: Calldata): void {
        super.onDeployment(_calldata);
        this._admin.value = this.contractDeployer;
    }

    protected onlyAdmin(): void {
        if (!Blockchain.tx.sender.equals(this._admin.value)) {
            throw new Revert('Only admin can call this method');
        }
    }

    /**
     * Changes the contract admin.
     * Only callable by the current admin.
     *
     * @param calldata Calldata containing an `Address` to change the admin to.
     */
    public changeAdmin(calldata: Calldata): BytesWriter {
        this.onlyAdmin();

        const response = new BytesWriter(BOOLEAN_BYTE_LENGTH);
        const to = calldata.readAddress();

        this._admin.value = to;

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
    public adminMint(calldata: Calldata): BytesWriter {
        this.onlyAdmin();

        const response = new BytesWriter(BOOLEAN_BYTE_LENGTH);
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

        // Can be more useful in the future if this contract is moved up to a more generic standard
        // Right now this is used for tokens where maxSupply is u256.Max, so this kind of error would be caught above.
        if (this._totalSupply.value > this.maxSupply) {
            throw new Revert('Max supply exceeded.');
        }

        this.createMintEvent(to, amount);

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
    public adminBurn(calldata: Calldata): BytesWriter {
        const response = new BytesWriter(BOOLEAN_BYTE_LENGTH);
        const from = calldata.readAddress();
        const amount = calldata.readU256();

        this._adminBurn(from, amount);

        this.createBurnEvent(amount);
        response.writeBoolean(true);
        return response;
    }

    protected _adminBurn(from: Address, amount: u256): void {
        this.onlyAdmin();
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

    public execute(method: Selector, calldata: Calldata): BytesWriter {
        switch (method) {
            case encodeSelector('adminMint(address,uint256)'):
                return this.adminMint(calldata);
            case encodeSelector('adminBurn(address,uint256)'):
                return this.adminBurn(calldata);
            case encodeSelector('changeAdmin(address)'):
                return this.changeAdmin(calldata);
            case encodeSelector('admin'): {
                const response = new BytesWriter(ADDRESS_BYTE_LENGTH);
                response.writeAddress(this.admin);

                return response;
            }
            default:
                return super.execute(method, calldata);
        }
    }
}
