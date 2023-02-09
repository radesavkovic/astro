// SPDX-License-Identifier: MIT
pragma solidity ^ 0.8.7;

interface IpAstroToken {
    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function getOwner() external view returns (address);
    function getCirculatingSupply() external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function setOwner(address owner) external;
    function setInitialDistributionFinished(bool value) external;
    function clearStuckBalance(address receiver) external;
    function rescueToken(address tokenAddress, uint256 tokens) external returns (bool success);
    function setPresaleFactory(address presaleFactory) external;
    function setAutoRebase(bool autoRebase) external;
    function setRebaseFrequency(uint256 rebaseFrequency) external;
    function setRewardYield(uint256 rewardYield, uint256 rewardYieldDenominator) external;
    function setNextRebase(uint256 nextRebase) external;
    function manualRebase() external;
}