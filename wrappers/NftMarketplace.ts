// import { Cell, contractAddress, StateInit } from 'ton';
import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    StateInit,
} from 'ton-core';
import { KeyPair, sign } from 'ton-crypto';
// import { NftMarketplaceCodeCell } from './NftMarketplace.source';

export type NftMarketplaceConfig = {
    seqno: number;
    subwallet: number;
    publicKey: Buffer;
};

export const OperationCodes = {
    DeploySale: 1,
};

export function buildSignature(params: { keyPair: KeyPair; saleStateInit: Cell; saleMessageBody: Cell }) {
    let bodyCell = new Cell();
    bodyCell.refs.push(params.saleStateInit);
    bodyCell.refs.push(params.saleMessageBody);

    return sign(bodyCell.hash(), params.keyPair.secretKey);
}

// ==================================================================
export function nftMarketplaceConfigToCell(config: NftMarketplaceConfig): Cell {
    return beginCell()
        .storeUint(0, 64)
        .storeUint(config.seqno, 32)
        .storeUint(config.subwallet, 32)
        .storeBuffer(config.publicKey)
        .endCell();
}
// ==================================================================

export class NftMarketplace implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftMarketplace(address);
    }

    static createFromConfig(config: NftMarketplaceConfig, code: Cell, workchain = 0) {
        const data = nftMarketplaceConfigToCell(config);
        const init = { code, data };
        return new NftMarketplace(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendDeploySaleSigned(
        provider: ContractProvider,
        via: Sender,
        opts: {
            keyPair: KeyPair;
            saleStateInit: Cell;
            saleMessageBody: Cell;
            value: bigint;
        }
    ) {
        let signature = buildSignature(opts);

        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1, 32).storeBuffer(signature).endCell(),
        });
    }

    // === Get
    async getSeqno(provider: ContractProvider) {
        let res = await provider.get('seqno', []);
        return res.stack.readNumber();
    }

    async getPublicKey(provider: ContractProvider) {
        let res = await provider.get('get_public_key', []);
        return res.stack.readBuffer();
    }
}
