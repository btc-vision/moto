import { ABIRegistry, Blockchain } from '@btc-vision/btc-runtime/runtime';
import { Moto } from './contracts/Moto';

export function defineSelectors(): void {
    ABIRegistry.defineGetterSelector('address', false);
    ABIRegistry.defineGetterSelector('owner', false);
    ABIRegistry.defineMethodSelector('isAddressOwner', false);

    ABIRegistry.defineMethodSelector('allowance', false);
    ABIRegistry.defineMethodSelector('approve', true);
    ABIRegistry.defineMethodSelector('balanceOf', false);
    ABIRegistry.defineMethodSelector('burn', true);
    ABIRegistry.defineMethodSelector('mint', true);
    ABIRegistry.defineMethodSelector('transfer', true);
    ABIRegistry.defineMethodSelector('transferFrom', true);

    ABIRegistry.defineGetterSelector('decimals', false);
    ABIRegistry.defineGetterSelector('name', false);
    ABIRegistry.defineGetterSelector('symbol', false);
    ABIRegistry.defineGetterSelector('totalSupply', false);
    ABIRegistry.defineGetterSelector('maxSupply', false);
}

Blockchain.contract = () => new Moto();

// VERY IMPORTANT
export * from '@btc-vision/btc-runtime/runtime/exports';
