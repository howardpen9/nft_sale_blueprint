import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type NftItemConfig = {
    index: number;
    master: Address;
};

export function nftItemConfigToCell(config: NftItemConfig): Cell {
    return beginCell().storeUint(config.index, 64).storeAddress(config.master).endCell();
}

export class NftItem implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftItem(address);
    }

    static createFromConfig(config: NftItemConfig, code: Cell, workchain = 0) {
        const data = nftItemConfigToCell(config);
        const init = { code, data };
        return new NftItem(contractAddress(workchain, init), init);
    }

    async sendBurn(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x55521d04, 32).storeUint(123, 64).endCell(),
        });
    }

    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        opts: {
            queryId: number;
            value: bigint;
            newOwner: Address;
            responseAddress?: Address;
            fwdAmount?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x5fcc3d14, 32) // opCode: Transfer
                .storeUint(opts.queryId, 64) // queryId
                .storeAddress(opts.newOwner)
                .storeAddress(opts.responseAddress || null)
                .storeBit(false) // no custom payload
                .storeCoins(opts.fwdAmount || 0)
                .storeBit(false)
                .endCell(),
        });
    }

    async sendTransferJetton(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            toAddress: Address;
            queryId: number;
            fwdAmount: bigint;
            jettonAmount: bigint;
            fwdPayload: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0xf8a7ea5, 32)
                .storeUint(opts.queryId, 64)
                .storeCoins(opts.jettonAmount)
                .storeAddress(opts.toAddress)
                .storeAddress(via.address)
                .storeUint(0, 1)
                .storeCoins(opts.fwdAmount)
                .storeUint(0, 1)
                .storeRef(opts.fwdPayload)
                .endCell(),
        });
    }

    // get methods

    async getNftContent(provider: ContractProvider) {
        let res = await provider.get('get_nft_content', []);
        return {
            lockup_time: res.stack.readNumber(),
            locked_amount: res.stack.readBigNumber(),
            index: res.stack.readNumber(),
        };
    }

    async getOwner(provider: ContractProvider) {
        const result = await provider.get('get_nft_data', []);
        result.stack.readBigNumber();
        result.stack.readBigNumber();
        result.stack.readAddress();
        return result.stack.readAddress();
    }
}
