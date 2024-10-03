import { ABIRegistry, Blockchain } from '@btc-vision/btc-runtime/runtime';
import { Moto } from './contracts/Moto';

export function defineSelectors(): void {
    /** OP_NET */
    ABIRegistry.defineMethodSelector('address');
    ABIRegistry.defineMethodSelector('owner');
    ABIRegistry.defineMethodSelector('isAddressOwner');

    /** OP_20 */
    ABIRegistry.defineMethodSelector('allowance');
    ABIRegistry.defineMethodSelector('approve');
    ABIRegistry.defineMethodSelector('balanceOf');
    ABIRegistry.defineMethodSelector('burn');
    ABIRegistry.defineMethodSelector('mint');
    ABIRegistry.defineMethodSelector('transfer');
    ABIRegistry.defineMethodSelector('transferFrom');

    ABIRegistry.defineMethodSelector('decimals');
    ABIRegistry.defineMethodSelector('name');
    ABIRegistry.defineMethodSelector('symbol');
    ABIRegistry.defineMethodSelector('totalSupply');
    ABIRegistry.defineMethodSelector('maxSupply');

    /** Moto */
    ABIRegistry.defineMethodSelector('airdrop');
    ABIRegistry.defineMethodSelector('airdropDefined');
}

Blockchain.contract = () => new Moto();

// VERY IMPORTANT
export * from '@btc-vision/btc-runtime/runtime/exports';
