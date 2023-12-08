import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, Dictionary, toNano } from '@ton/core';
import { SecondLesson } from '../wrappers/SecondLesson';
import '@ton/test-utils';
import { inspect } from 'util';

describe('SecondLesson', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let secondLesson: SandboxContract<SecondLesson>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        secondLesson = blockchain.openContract(await SecondLesson.fromInit(deployer.address, Dictionary.empty<Address, bigint>(), 0n));


        const deployResult = await secondLesson.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            null
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: secondLesson.address,
            deploy: true,
            success: true,
        });
    });

    it('should add addresses and broadcast', async () => {
        let user1 = await blockchain.treasury('user1');
        let user2 = await blockchain.treasury('user2');
        let user3 = await blockchain.treasury('user3');
        let user4 = await blockchain.treasury('user4');
        let user5 = await blockchain.treasury('user5');
        await secondLesson.send(deployer.getSender(), {value: toNano("0.05")}, {$$type: 'AddContact', contact: user1.address});
        await secondLesson.send(deployer.getSender(), {value: toNano("0.05")}, {$$type: 'AddContact', contact: user2.address});
        await secondLesson.send(deployer.getSender(), {value: toNano("0.05")}, {$$type: 'AddContact', contact: user3.address});
        await secondLesson.send(deployer.getSender(), {value: toNano("0.05")}, {$$type: 'AddContact', contact: user4.address});
        await secondLesson.send(deployer.getSender(), {value: toNano("0.05")}, {$$type: 'AddContact', contact: user5.address});

        let tx = await secondLesson.send(deployer.getSender(), {value: toNano("6")}, {$$type: 'Broadcast', text: "Hello user", value: toNano(1)});
        // console.log(tx.events)
        expect(tx.transactions).toHaveTransaction({
            from: secondLesson.address,
            to: user1.address,
            op: 0
        })
        expect(tx.transactions).toHaveTransaction({
            from: secondLesson.address,
            to: user2.address,
            op: 0
        })
        expect(tx.transactions).toHaveTransaction({
            from: secondLesson.address,
            to: user3.address,
            op: 0
        })
        expect(tx.transactions).toHaveTransaction({
            from: secondLesson.address,
            to: user4.address,
            op: 0
        })
        expect(tx.transactions).toHaveTransaction({
            from: secondLesson.address,
            to: user5.address,
            op: 0
        })
    });
});
