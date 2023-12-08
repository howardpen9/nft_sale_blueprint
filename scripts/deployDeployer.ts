import { Address, beginCell, toNano } from 'ton-core';
import { compile, NetworkProvider } from '@ton-community/blueprint';

import { Deployer } from '../wrappers/Deployer';
import { TokenStaking } from '../wrappers/TokenStaking';

export async function run(provider: NetworkProvider) {
    const deployer = provider.open(
        Deployer.createFromConfig(
            {
                owner_address: Address.parse('kQD1ptyvitBi3JbHaDQt_6j-15ABn9BqdABTFA1vgzs3AVU5'),
            },
            await compile('Deployer')
        )
    );

    await deployer.sendDeploy(provider.sender(), toNano('0.05'));
}
