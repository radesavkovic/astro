// SPDX-License-Identifier: MIT
pragma solidity ^ 0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IAstroToken.sol";
import "./interface/IJoeRouter02.sol";

contract DashboardFactory is Ownable {
    IAstroToken _astroAddress;
    IERC20 _usdcAddress;
    IJoeRouter02 public _joe02Router;

    uint256 public ONE_DAY                          = 60 * 60 * 24;                 // Seconds for one day

    mapping(address => uint256) public userClaimTimes;

    constructor(address _router, address _pAstro, address _usdc) {
        _joe02Router = IJoeRouter02(_router);
        _astroAddress = IAstroToken(_pAstro);
        _usdcAddress = IERC20(_usdc);
    }

    function claimASTRO(uint _percent) external {
        require(_percent < 10, "Percent dosen't allowed.");
        require(userClaimTimes[msg.sender] + ONE_DAY < block.timestamp, "User can't claim several time per one day.");
        
        uint256 userBalance = _astroAddress.balanceOf(msg.sender);
        uint256 claimAmount = userBalance * _percent / 100;

        uint256 initalBalance = _astroAddress.balanceOf(address(this));
        _astroAddress.transferFrom(msg.sender, address(this), claimAmount);
        uint256 receivedAmount = _astroAddress.balanceOf(address(this)) - initalBalance;

        _swapTokensForUSDC (receivedAmount, msg.sender);

        userClaimTimes[msg.sender] = block.timestamp;

        emit ClaimASTRO(msg.sender, claimAmount);
    }

    function _swapTokensForAVAX(uint256 tokenAmount, address receiver) private {
        address[] memory path = new address[](2);
        path[0] = address(_astroAddress);
        path[1] = _joe02Router.WAVAX();

        _astroAddress.approve(address(_joe02Router), tokenAmount);

        _joe02Router.swapExactTokensForAVAXSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            receiver,
            block.timestamp
        );
    }

    function _swapTokensForUSDC(uint256 tokenAmount, address receiver) private {
        address[] memory path = new address[](3);
        path[0] = address(_astroAddress);
        path[1] = _joe02Router.WAVAX();
        path[2] = address(_usdcAddress);

        _astroAddress.approve(address(_joe02Router), tokenAmount);

        _joe02Router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            receiver,
            block.timestamp
        );
    }

    function setASTROAddress (address _astro) external onlyOwner {
        _astroAddress = IAstroToken(_astro);

        emit SetASTROAddress(msg.sender, _astro);
    }

    event SetClaimFee(address _from, uint256 _fee);
    event ClaimASTRO(address _from, uint256 _astro);
    event SetASTROAddress(address _from, address _astro);
}