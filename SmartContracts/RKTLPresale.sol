// SPDX-License-Identifier: MIT

/*
 * _______________________________________________________________________________________________________________________________
 *     ____                                      _                                         ____                                   
 *     /    )               /                    /                               /         /    )                          /      
 * ---/___ /----__----__---/-__----__--_/_------/-------__-----------__----__---/__-------/____/---)__----__---__----__---/----__-
 *   /    |   /   ) /   ' /(     /___) /       /      /   ) /   /  /   ) /   ' /   )     /        /   ) /___) (_ ` /   ) /   /___)
 * _/_____|__(___/_(___ _/___\__(___ _(_ _____/____/_(___(_(___(__/___/_(___ _/___/_____/________/_____(___ _(__)_(___(_/___(___ _
 *                                                                                                                                
 * Rocket Launch Finance
 *
 * Telegram: https://t.me/RocketLaunch
 * Twitter: https://twitter.com/RocketLaunch
 * dApp: https://rocketlaunch.finance/
 */

pragma solidity ^ 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IpAstroToken.sol";
import "./interface/IJoeRouter02.sol";

contract RKTLPresale is Ownable {
    IpAstroToken _pAstroAddress;
    IERC20 _usdcAddress;
    IJoeRouter02 public _joe02Router;

    // min/max cap
    uint256 public minCapUSDC                                       = 50 * 10 ** 6;
    uint256 public maxCapUSDC                                       = 5000 * 10 ** 6;
    uint256 public pTokenPrice_USDC                                 = 7 * 10 ** 3;
    
    // presale period
    uint256 public start_time;
    uint256 public end_time;

    // owner address token receive
    address payable presaleOwnerAddress                             = payable(0xbAB8E9cA493E21d5A3f3e84877Ba514c405be0e1);

    mapping (address => uint256) private _userPaidUSDC;

    constructor(address _router, address _pAstro, address _usdc) {
        _joe02Router = IJoeRouter02(_router);
        _pAstroAddress = IpAstroToken(_pAstro);
        _usdcAddress = IERC20(_usdc);
    }

    function buyTokensByUSDC(uint256 _amountPrice) external {
        require(block.timestamp >= start_time && block.timestamp <= end_time, "RKTLPresale: Not presale period");

        // token amount user want to buy
        uint256 tokenAmount = _amountPrice / pTokenPrice_USDC * 10 ** 18;

        uint256 currentPaid = _userPaidUSDC[msg.sender];
        require(currentPaid + _amountPrice >= minCapUSDC && currentPaid + _amountPrice <= maxCapUSDC, "RKTLPresale: The price is not allowed for presale.");
        
        // transfer USDC to owners
        _usdcAddress.transferFrom(msg.sender, presaleOwnerAddress, _amountPrice);

        // transfer pASTRO token to user
        _pAstroAddress.transfer(msg.sender, tokenAmount);

        // add USDC user bought
        _userPaidUSDC[msg.sender] += _amountPrice;

        emit Presale(address(this), msg.sender, tokenAmount);
    }

    function buyTokensByAVAX() external payable {
        require(block.timestamp >= start_time && block.timestamp <= end_time, "RKTLPresale: Not presale period");
        
        require(msg.value > 0, "Insufficient AVAX amount");
        uint256 amountPrice = getLatestAVAXPrice (msg.value);
 
        // token amount user want to buy
        uint256 tokenAmount = amountPrice / pTokenPrice_USDC * 10 ** 18;

        uint256 currentPaid = _userPaidUSDC[msg.sender];
        require(currentPaid + amountPrice >= minCapUSDC && currentPaid + amountPrice <= maxCapUSDC, "RKTLPresale: The price is not allowed for presale.");
        
        // transfer AVAX to owner
        presaleOwnerAddress.transfer(msg.value);

        // transfer pASTRO token to user
        _pAstroAddress.transfer(msg.sender, tokenAmount);

        // add USDC user bought
        _userPaidUSDC[msg.sender] += amountPrice;

        emit Presale(address(this), msg.sender, tokenAmount);
    }

    function getLatestAVAXPrice(uint256 _amount) public view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = _joe02Router.WAVAX();
        path[1] = address(_usdcAddress);

        uint256[] memory price_out = _joe02Router.getAmountsOut(_amount, path);
        uint256 price_round = price_out[1] / 10 ** 6;
        return price_round * 10 ** 6;
    }

    function withdrawAll() external onlyOwner{
        uint256 balance = _pAstroAddress.balanceOf(address(this));
        if(balance > 0) {
            _pAstroAddress.transfer(msg.sender, balance);
        }

        emit WithdrawAll (msg.sender, balance);
    }

    function getUserPaidUSDC () public view returns (uint256) {
        return _userPaidUSDC[msg.sender];
    }

    function setMinCapUSDC(uint256 _minCap) external onlyOwner {
        minCapUSDC = _minCap;

        emit SetMinCap(_minCap);
    }

    function setMaxCapUSDC(uint256 _maxCap) external onlyOwner {
        maxCapUSDC = _maxCap;

        emit SetMaxCap(_maxCap);
    }

    function setStartTime(uint256 _time) external onlyOwner {
        start_time = _time;

        emit SetStartTime(_time);
    }

    function setEndTime(uint256 _time) external onlyOwner {
        end_time = _time;

        emit SetEndTime(_time);
    }

    function setpTokenPriceUSDC(uint256 _pTokenPrice) external onlyOwner {
        pTokenPrice_USDC = _pTokenPrice;

        emit SetpTokenPrice(_pTokenPrice, 1);
    }

    function setPresaleOwnerAddress(address _add) external onlyOwner {
        presaleOwnerAddress = payable(_add);

        emit SetPresaleOwnerAddress (_add);
    }

    event Presale(address _from, address _to, uint256 _amount);
    event SetMinCap(uint256 _amount);
    event SetMaxCap(uint256 _amount);
    event SetpTokenPrice(uint256 _price, uint _type);
    event SetPresaleOwnerAddress(address _add);
    event SetStartTime(uint256 _time);
    event SetEndTime(uint256 _time);
    event WithdrawAll(address addr, uint256 astro);

    receive() payable external {}

    fallback() payable external {}
}