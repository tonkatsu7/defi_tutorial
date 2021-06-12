pragma solidity ^0.5.0;

import "./DappToken.sol";
import "./DaiToken.sol";

contract TokenFarm {
    string public name = "Dapp Token Farm";
    DappToken public dappToken;
    DaiToken public daiToken;
    address public owner;

    address[] public stakers;
    mapping(address => uint) public stakingBalance;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;

    constructor(DappToken _dappToken, DaiToken _daiToken) public {
        dappToken = _dappToken;
        daiToken = _daiToken;
        owner =  msg.sender;
    }

    // 1. stake tokens - deposit
    function stakeTokens(uint _amount) public {
        // check
        require(_amount > 0, "amount must be greater than 0");

        //  transfer mock dai tokens to this contract for staking
        daiToken.transferFrom(msg.sender, address(this), _amount);

        // update staking balance
        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

        // tell the app that the user has staked
        if (!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }
        hasStaked[msg.sender] = true;
        isStaking[msg.sender] = true;
    }

    // 2. unstaking tokens - withdraw
    function unstakeTokens() public {
        require(isStaking[msg.sender], "caller must be staking");

        uint balance = stakingBalance[msg.sender];

        require(balance > 0, "staking balance must be greater than 0");

        daiToken.transfer(msg.sender, balance);

        stakingBalance[msg.sender] = 0;

        isStaking[msg.sender] = false;
    }

    // 3. issuing tokens - earning interest
    function issueTokens() public {
        // check
        require(msg.sender == owner, "caller must be the owner");

        // iterate through all stakers
        for (uint i = 0; i < stakers.length; i++) {
            address recipient = stakers[i];
            // the reward will be the same as the amount staked
            uint balance = stakingBalance[recipient];
            if (balance > 0) { // check
                dappToken.transfer(recipient, balance);
            } 
        }
    }
}