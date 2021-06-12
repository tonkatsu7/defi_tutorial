const { assert } = require('chai')

const DaiToken = artifacts.require('DaiToken')
const DappToken = artifacts.require('DappToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai')
    .use(require('chai-as-promised'))
    .should()

function tokens(n) {
    return web3.utils.toWei(n, 'ether')
}

contract('TokenFarm', ([owner, investor]) => {
    let daiToken, dappToken, tokenFarm

    before(async () => {
        // Load contracts
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        // Transfer all dapp tokens to the TokenFarm
        await dappToken.transfer(tokenFarm.address, tokens('1000000'))

        // Send tokens to investor
        await daiToken.transfer(investor, tokens('100'), { from: owner })
    })

    describe('Mock Dai deployment', async () => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })

    describe('Dapp Token deployment', async () => {
        it('has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'DApp Token')
        })
    })

    describe('Token Farm deployment', async () => {
        it('has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, 'Dapp Token Farm')
        })

        it('contract has tokens', async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })

        it('investor has tokens', async () => {
            let balance = await daiToken.balanceOf(investor)
            assert.equal(balance.toString(), tokens('100'))
        })
    })

    describe('Farming tokens', async () => {
        it('rewards investors for staking mDai tokens', async () => {
            let result
            // check investor balance before staking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct before staking')
            
            // approve dai token spending
            await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor })
            // stake
            await tokenFarm.stakeTokens(tokens('90'), { from: investor  })

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('10'), 'investor Mock DAI wallet balance correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('90'), 'Token Farm Mock DAI wallet balance correct after staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('90'), 'investor staking balance correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result, true, 'investor is staking')

            // issue tokens
            await tokenFarm.issueTokens()

            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('90'), 'investor Mock DAPP wallet balance correct after staking')

            // test that only the owner can issue tokens
            await tokenFarm.issueTokens({ from: investor }).should.be.rejected;

            await tokenFarm.issueTokens()

            // unstake
            await tokenFarm.unstakeTokens({ from: investor })

            result = await tokenFarm.isStaking(investor)
            assert.equal(result, false, 'investor is no longer staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'investor staking balance correct after unstaking')

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct after unstaking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'Token Farm Mock DAI wallet balance correct after staking')

            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('180'), 'investor Mock DAPP wallet balance correct after staking')
        })
    })
})    