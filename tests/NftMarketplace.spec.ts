import '@ton-community/test-utils';
// import { randomAddress } from '../../utils/randomAddress';
// import { CellMessage, CommonMessageInfo, InternalMessage, StateInit, toNano } from 'ton';
import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    TupleBuilder,
} from 'ton-core';
import { KeyPair } from 'ton-crypto';
// import { NftMarketplaceData } from './NftMarketplace.data';
// import { NftMarketplaceLocal } from './NftMarketplaceLocal';
import { NftMarketplace, NftMarketplaceConfig } from '../wrappers/NftMarketplace';
import { NftMarketplace, NftMarketplaceConfig } from '../wrappers/NftMarketplace';

import { compile } from '@ton-community/blueprint';

import { randomKeyPair } from '../../utils/randomKeyPair';
import { SendMsgAction } from 'ton-contract-executor';

let defaultConfig: NftMarketplaceConfig;
let keyPair: KeyPair;

describe('nft marketplace smc', () => {
    let market_code: Cell;
    let sale_code: Cell;

    beforeAll(async () => {
        keyPair = await randomKeyPair();

        defaultConfig = {
            seqno: 77,
            subwallet: 88,
            publicKey: keyPair.publicKey,
        };

        market_code = await compile('NftMarketplace');
        sale_code = await compile('NftSale');
    });

    it('should return seqno', async () => {
        let market = await NftMarketplace.createFromConfig({});
        let res = await market.getSeqno();
        expect(res.eqn(defaultConfig.seqno)).toBe(true);
    });

    it('should return public key', async () => {
        let market = await NftMarketplaceLocal.createFromConfig(defaultConfig);
        let res = await market.getPublicKey();
        expect(res.equals(defaultConfig.publicKey)).toBe(true);
    });

    it('should deploy signed nft sale', async () => {
        let market = await NftMarketplaceLocal.createFromConfig(defaultConfig);
        let sender = randomAddress();

        let saleCode = new Cell();
        saleCode.bits.writeUint(123, 32);
        let saleData = new Cell();
        saleData.bits.writeUint(1234, 32);
        let saleStateInit = new StateInit({
            code: saleCode,
            data: saleData,
        });

        let saleStateInitCell = new Cell();
        saleStateInit.writeTo(saleStateInitCell);

        let saleMessageBody = new Cell();
        saleMessageBody.bits.writeUint(12345, 32);

        let res = await market.sendDeploySaleSigned(sender, {
            saleStateInit: saleStateInitCell,
            saleMessageBody: saleMessageBody,
            keyPair,
        });

        if (res.type !== 'success') {
            throw new Error();
        }
        let [initMessage] = res.actionList as [SendMsgAction];

        expect(initMessage.message.init!.code!.toString()).toEqual(saleCode.toString());
        expect(initMessage.message.init!.data!.toString()).toEqual(saleData.toString());
        expect(initMessage.message.body.toString()).toEqual(saleMessageBody.toString());
        expect(initMessage.mode).toEqual(64); // transfer all funds from message
    });

    it('should accept coins if empty message was sent', async () => {
        let market = await NftMarketplaceLocal.createFromConfig(defaultConfig);
        let res = await market.contract.sendInternalMessage(
            new InternalMessage({
                to: market.address,
                from: randomAddress(),
                value: toNano(1),
                bounce: false,
                body: new CommonMessageInfo({
                    body: new CellMessage(new Cell()),
                }),
            })
        );
        if (res.type !== 'success') {
            throw new Error();
        }

        expect(res.exit_code).toEqual(0);
        expect(res.actionList).toHaveLength(0);
    });
});
