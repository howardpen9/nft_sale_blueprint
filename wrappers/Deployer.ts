import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type DeployerConfig = {
    owner_address: Address;
};

export function deployerConfigToCell(config: DeployerConfig): Cell {
    return beginCell().storeAddress(config.owner_address).endCell();
}

export class Deployer implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Deployer(address);
    }

    static createFromConfig(config: DeployerConfig, code: Cell, workchain = 0) {
        const data = deployerConfigToCell(config);
        const init = { code, data };
        return new Deployer(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendBurn(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x55521d04, 32).storeUint(123, 64).endCell(),
        });
    }

    // get methods

    // async getNftContent(provider: ContractProvider) {
    //     let res = await provider.get('get_nft_content', []);
    //     return {
    //         lockup_time: res.stack.readNumber(),
    //         locked_amount: res.stack.readBigNumber(),
    //         index: res.stack.readNumber(),
    //     };
    // }

    // async getOwner(provider: ContractProvider) {
    //     const result = await provider.get('get_nft_data', []);
    //     result.stack.readBigNumber();
    //     result.stack.readBigNumber();
    //     result.stack.readAddress();
    //     return result.stack.readAddress();
    // }
}
