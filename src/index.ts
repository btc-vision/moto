import { Blockchain } from '@btc-vision/btc-runtime/runtime';
import { Moto } from './contracts/Moto';

// DO NOT TOUCH TO THIS.
Blockchain.contract = () => {
    // ONLY CHANGE THE CONTRACT CLASS NAME.
    // DO NOT ADD CUSTOM LOGIC HERE.

    return new Moto();
};

// VERY IMPORTANT
export * from '@btc-vision/btc-runtime/runtime/exports';
