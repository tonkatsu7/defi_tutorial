const DappToken = artifacts.require("DappToken");
const DaiToken = artifacts.require("DaiToken");
const TokenFarm = artifacts.require("TokenFarm");

module.exports = async function(deployer, network, accounts) {
    // Deploy mock dai token
    await deployer.deploy(DaiToken)
    const daiToken = await DaiToken.deployed()

    // Deploy dapp token
    await deployer.deploy(DappToken)
    const dappToken = await DappToken.deployed()

    // Deploy token farm
    await deployer.deploy(TokenFarm, dappToken.address, daiToken.address);
    const tokenFarm = await TokenFarm.deployed()

    // Transfer all tokens to TokenFarm (1 million)
    await dappToken.transfer(tokenFarm.address, '100000000000000000000')

    // Transfer 100 mock dai tokens to investor
    await daiToken.transfer(accounts[1], '100000000000000000000')
};
