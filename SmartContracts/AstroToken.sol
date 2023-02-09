// SPDX-License-Identifier: MIT
pragma solidity ^ 0.8.0;



import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./library/SafeMathInt.sol";
import "./library/ERC20Detailed.sol";
import "./interface/IDEXFactory.sol";
import "./interface/IDEXRouter.sol";
import "./interface/InterfaceLP.sol";

contract RKTLToken is ERC20Detailed {
    using SafeMath for uint256;
    using SafeMathInt for int256;

    address owner;

    bool public initialDistributionFinished = false;
    bool public swapEnabled = false;
    bool public autoRebase = false;
    bool public feesOnNormalTransfers = false;

    uint256 public rewardYield = 3944150; // APY: 100,103.36795485453209020930376137, Daily ROI: 1.910846122730853405394701828557
    uint256 public rewardYieldDenominator = 10000000000;
    uint256 public maxSellTransactionAmount = 50000 * 10**DECIMALS;

    uint256 public rebaseFrequency = 1800;
    uint256 public nextRebase = block.timestamp + 43200000;

    mapping (address => bool) _isFeeExempt;
    address[] public _markerPairs;
    mapping (address => bool) public automatedMarketMakerPairs;
    mapping (address => bool) public justBusinessList;
    mapping (address => uint256) private userInitialAmount;

    uint256 public constant MAX_FEE_RATE = 35;
    uint256 private constant MAX_REBASE_FREQUENCY = 1800;
    uint256 private constant DECIMALS = 18;
    uint256 private constant MAX_UINT256 = ~uint256(0);
    uint256 private constant INITIAL_FRAGMENTS_SUPPLY = 1 * 10**9 * 10**DECIMALS;
    uint256 private TOTAL_GONS;
    uint256 private constant MAX_SUPPLY = ~uint256(0);

    address DEAD = 0x000000000000000000000000000000000000dEaD;
    address ZERO = 0x0000000000000000000000000000000000000000;

    address public liquidityReceiver = DEAD;
    address public treasuryReceiver = DEAD;
    address public riskFreeValueReceiver = DEAD;
    address public operationsReceiver = DEAD;
    address public xRKTLReceiver = DEAD;
    address public futureEcosystemReceiver = DEAD;
    address public burnReceiver = DEAD;

    IDEXRouter public router;
    address public pair;
    IERC20 public usdcAddress;

    /*
        0: Buy Fee
        1: Sell Fee
        2: Whale Sell Fee 
        3: Invator Fee
    */
    uint256[4] public totalFee          = [1500, 2000, 5000, 8000];
    uint256[4] public liquidityFee      = [495, 500, 1250, 2000];
    uint256[4] public treasuryFee       = [480, 500, 1250, 2000];
    uint256[4] public riskFeeValueFee   = [150, 400, 1000, 1600];
    uint256[4] public ecosystemFee      = [75, 200, 500, 800];
    uint256[4] public operationsFee     = [150, 100, 250, 400];
    uint256[4] public xRKTLFee          = [150, 100, 250, 400];
    uint256[4] public burnFee           = [0, 200, 500, 800];
    uint256 public feeDenominator = 10000;

    uint256 public normalSellLimit       = 1 * 10 ** 4 * 10 ** 6;
    uint256 public whaleSellLimit        = 25 * 10 ** 3 * 10 ** 6;

    uint256 targetLiquidity = 50;
    uint256 targetLiquidityDenominator = 100;

    bool inSwap;

    modifier swapping() {
        inSwap = true;
        _;
        inSwap = false;
    }

    modifier validRecipient(address to) {
        require(to != address(0x0));
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "RKTLToken: Caller is not owner the contract.");
        _;
    }

    uint256 private _totalSupply;
    uint256 private _gonsPerFragment;
    uint256 private gonSwapThreshold = (TOTAL_GONS * 10).div(10000);

    mapping(address => uint256) private _gonBalances;
    mapping(address => mapping(address => uint256)) private _allowedFragments;

    constructor(address _router, address _usdcAddress) ERC20Detailed("RKTL Token", "RKTL", uint8(DECIMALS)) {
        owner = msg.sender;
        TOTAL_GONS = MAX_UINT256 - (MAX_UINT256 % INITIAL_FRAGMENTS_SUPPLY);
        router = IDEXRouter(_router);
        usdcAddress = IERC20(_usdcAddress);
        pair = IDEXFactory(router.factory()).createPair(address(this), router.WAVAX());

        _allowedFragments[address(this)][address(router)] = ~uint256(0);
        _allowedFragments[address(this)][pair] = ~uint256(0);
        _allowedFragments[address(this)][address(this)] = ~uint256(0);

        setAutomatedMarketMakerPair(pair, true);

        _totalSupply = INITIAL_FRAGMENTS_SUPPLY;
        _gonBalances[msg.sender] = TOTAL_GONS;
        _gonsPerFragment = TOTAL_GONS.div(_totalSupply);

        _isFeeExempt[treasuryReceiver] = true;
        _isFeeExempt[riskFreeValueReceiver] = true;
        _isFeeExempt[operationsReceiver] = true;
        _isFeeExempt[xRKTLReceiver] = true;
        _isFeeExempt[futureEcosystemReceiver] = true;
        _isFeeExempt[address(this)] = true;
        _isFeeExempt[msg.sender] = true;

        emit Transfer(address(0x0), msg.sender, _totalSupply);
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function allowance(address owner_, address spender) external view override returns (uint256) {
        return _allowedFragments[owner_][spender];
    }

    function balanceOf(address who) public view override returns (uint256) {
        if (automatedMarketMakerPairs[who])
            return _gonBalances[who];
        else
            return _gonBalances[who].div(_gonsPerFragment);
    }

    function initialBalanceOf(address who) public view returns (uint256) {
        return userInitialAmount[who];
    }

    function checkFeeExempt(address _addr) external view returns (bool) {
        return _isFeeExempt[_addr];
    }

    function checkSwapThreshold() external view returns (uint256) {
        return gonSwapThreshold.div(_gonsPerFragment);
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function shouldRebase() internal view returns (bool) {
        return nextRebase <= block.timestamp;
    }

    function shouldTakeFee(address from, address to) internal view returns (bool) {
        if (_isFeeExempt[from] || _isFeeExempt[to]) {
            return false;
        } else if (feesOnNormalTransfers) {
            return true;
        } else {
            return (automatedMarketMakerPairs[from] || automatedMarketMakerPairs[to]);
        }
    }

    function shouldSwapBack() internal view returns (bool) {
        return
            !automatedMarketMakerPairs[msg.sender] &&
            !inSwap &&
            swapEnabled &&
            totalFee[0] + totalFee[1] > 0 &&
            _gonBalances[address(this)] >= gonSwapThreshold;
    }

    function getCirculatingSupply() public view returns (uint256) {
        return (TOTAL_GONS.sub(_gonBalances[DEAD]).sub(_gonBalances[ZERO])).div(_gonsPerFragment);
    }

    function getLiquidityBacking(uint256 accuracy) public view returns (uint256) {
        uint256 liquidityBalance = 0;
        for (uint i = 0; i < _markerPairs.length; i++){
            liquidityBalance.add(balanceOf(_markerPairs[i]).div(10 ** 9));
        }
        return accuracy.mul(liquidityBalance.mul(2)).div(getCirculatingSupply().div(10 ** 9));
    }

    function isOverLiquified(uint256 target, uint256 accuracy) public view returns (bool) {
        return getLiquidityBacking(accuracy) > target;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function manualSync() public {
        for (uint i = 0; i < _markerPairs.length; i++){
            InterfaceLP(_markerPairs[i]).sync();
        }
    }

    function transfer(address to, uint256 value) external override validRecipient(to) returns (bool) {
        _transferFrom(msg.sender, to, value);
        return true;
    }

    function _basicTransfer(address from, address to, uint256 amount) internal returns (bool) {
        uint256 gonAddAmount = amount.mul(_gonsPerFragment);
        uint256 gonSubAmount = amount.mul(_gonsPerFragment);

        if (automatedMarketMakerPairs[from])
            gonSubAmount = amount;

        if (automatedMarketMakerPairs[to])
            gonAddAmount = amount;

        _gonBalances[from] = _gonBalances[from].sub(gonSubAmount);
        _gonBalances[to] = _gonBalances[to].add(gonAddAmount);

        emit Transfer(from, to, amount);
        return true;
    }

    function _transferFrom(address sender, address recipient, uint256 amount) internal returns (bool) {
        bool excludedAccount = _isFeeExempt[sender] || _isFeeExempt[recipient];

        require(initialDistributionFinished || excludedAccount, "Trading not started");

        if (
            automatedMarketMakerPairs[recipient] &&
            !excludedAccount
        ) {
            require(amount <= maxSellTransactionAmount, "Error amount");
        }

        if (inSwap) {
            return _basicTransfer(sender, recipient, amount);
        }

        uint256 gonAmount = amount.mul(_gonsPerFragment);

        if (shouldSwapBack()) {
            swapBack();
        }

        if (automatedMarketMakerPairs[sender]) {
            _gonBalances[sender] = _gonBalances[sender].sub(amount);
        }
        else {
            _gonBalances[sender] = _gonBalances[sender].sub(gonAmount);
        }

        uint256 gonAmountReceived = shouldTakeFee(sender, recipient) ? takeFee(sender, recipient, gonAmount) : gonAmount;
        if (automatedMarketMakerPairs[recipient]) {
            _gonBalances[recipient] = _gonBalances[recipient].add(gonAmountReceived.div(_gonsPerFragment));
        }
        else {
            _gonBalances[recipient] = _gonBalances[recipient].add(gonAmountReceived);
            userInitialAmount[recipient] = userInitialAmount[recipient].add(gonAmountReceived);
        }

        emit Transfer(sender, recipient, gonAmountReceived.div(_gonsPerFragment));

        if (shouldRebase() && autoRebase) {
            _rebase();

            if (!automatedMarketMakerPairs[sender] && !automatedMarketMakerPairs[recipient]) {
                manualSync();
            }
        }

        return true;
    }

    function transferFrom(address from, address to, uint256 value) external override validRecipient(to) returns (bool) {
        if (_allowedFragments[from][msg.sender] != ~uint256(0)) {
            _allowedFragments[from][msg.sender] = _allowedFragments[from][msg.sender].sub(value, "Insufficient Allowance");
        }

        _transferFrom(from, to, value);
        return true;
    }

    function _swapAndLiquify(uint256 contractTokenBalance) private {
        uint256 half = contractTokenBalance.div(2);
        uint256 otherHalf = contractTokenBalance.sub(half);

        uint256 initialBalance = address(this).balance;

        _swapTokensForAVAX(half, address(this));

        uint256 newBalance = address(this).balance.sub(initialBalance);

        _addLiquidity(otherHalf, newBalance);

        emit SwapAndLiquify(half, newBalance, otherHalf);
    }

    function _addLiquidity(uint256 tokenAmount, uint256 avaxAmount) private {
        router.addLiquidityAVAX{value: avaxAmount}(
            address(this),
            tokenAmount,
            0,
            0,
            liquidityReceiver,
            block.timestamp
        );
    }

    function _swapTokensForAVAX(uint256 tokenAmount, address receiver) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = router.WAVAX();

        router.swapExactTokensForAVAXSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            receiver,
            block.timestamp
        );
    }

    function swapBack() internal swapping {
        uint256 realTotalFee = totalFee[0].add(totalFee[1]).add(totalFee[2]).add(totalFee[3]);

        uint256 contractTokenBalance = _gonBalances[address(this)].div(_gonsPerFragment);

        uint256 amountToLiquify = 0;
        if (!isOverLiquified(targetLiquidity, targetLiquidityDenominator))
            amountToLiquify = contractTokenBalance.mul(liquidityFee[0] + liquidityFee[1] + liquidityFee[2] + liquidityFee[3]).div(realTotalFee);
        uint256 amountToRFV = contractTokenBalance.mul(riskFeeValueFee[0] + riskFeeValueFee[1] + riskFeeValueFee[2] + riskFeeValueFee[3]).div(realTotalFee);
        uint256 amountToTreasury = contractTokenBalance.mul(treasuryFee[0] + treasuryFee[1] + treasuryFee[2] + treasuryFee[3]).div(realTotalFee);
        uint256 amountToOperation = contractTokenBalance.mul(operationsFee[0] + operationsFee[1] + operationsFee[2] + operationsFee[3]).div(realTotalFee);
        uint256 amountToxRKTL = contractTokenBalance.mul(xRKTLFee[0] + xRKTLFee[1] + xRKTLFee[2] + xRKTLFee[3]).div(realTotalFee);
        uint256 amountToEcosystem = contractTokenBalance.mul(ecosystemFee[0] + ecosystemFee[1] + ecosystemFee[2] + ecosystemFee[3]).div(realTotalFee);
        uint256 amountToBurn = contractTokenBalance - amountToLiquify - amountToRFV - amountToTreasury - amountToOperation - amountToxRKTL - amountToEcosystem;

        if (amountToLiquify > 0) {
            _swapAndLiquify(amountToLiquify);
        }

        if (amountToRFV > 0) {
            _swapTokensForAVAX(amountToRFV, riskFreeValueReceiver);
        }

        if (amountToTreasury > 0) {
            _swapTokensForAVAX(amountToTreasury, treasuryReceiver);
        }

        if (amountToxRKTL > 0) {
            _swapTokensForAVAX(amountToxRKTL, xRKTLReceiver);
        }

        if (amountToOperation > 0) {
            _swapTokensForAVAX(amountToOperation, operationsReceiver);
        }

        if (amountToEcosystem > 0) {
            _swapTokensForAVAX(amountToEcosystem, futureEcosystemReceiver);
        }

        if (amountToBurn > 0) {
            _basicTransfer (address(this), burnReceiver, amountToBurn);
        }

        emit SwapBack(contractTokenBalance, amountToLiquify, amountToRFV, amountToTreasury);
    }

    function takeFee(address sender, address recipient, uint256 gonAmount) internal returns (uint256) {
        uint256 amount = gonAmount.div(_gonsPerFragment);
        uint256 usdcAmount = getUSDCFromRKTL (amount);

        uint256 _realFee = 0;
        if(automatedMarketMakerPairs[recipient]) {
            _realFee = totalFee[1];
            if (usdcAmount > normalSellLimit) {
                _realFee = totalFee[2];
            }
            else if (usdcAmount > whaleSellLimit) {
                _realFee = totalFee[3];
            }
        }
        else {
            _realFee = totalFee[0];
        }

        uint256 feeAmount = gonAmount.mul(_realFee).div(feeDenominator);

        _gonBalances[address(this)] = _gonBalances[address(this)].add(feeAmount);
        emit Transfer(sender, address(this), feeAmount.div(_gonsPerFragment));
        return gonAmount.sub(feeAmount);
    }

    function getUSDCFromRKTL(uint256 _amount) public view returns (uint256) {
        address[] memory path = new address[](3);
        path[0] = address(this);
        path[1] = router.WAVAX();
        path[2] = address(usdcAddress);

        uint256[] memory price_out = router.getAmountsOut(_amount, path);
        return price_out[2];
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        uint256 oldValue = _allowedFragments[msg.sender][spender];

        if (subtractedValue >= oldValue) {
            _allowedFragments[msg.sender][spender] = 0;
        } else {
            _allowedFragments[msg.sender][spender] = oldValue.sub(subtractedValue);
        }

        emit Approval(msg.sender, spender, _allowedFragments[msg.sender][spender]);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        _allowedFragments[msg.sender][spender] = _allowedFragments[msg.sender][spender].add(addedValue);
        emit Approval(msg.sender, spender, _allowedFragments[msg.sender][spender]);
        return true;
    }

    function approve(address spender, uint256 value) external override returns (bool) {
        _allowedFragments[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function _rebase() private {
        if (!inSwap) {
            uint256 circulatingSupply = getCirculatingSupply();
            int256 supplyDelta = int256(circulatingSupply.mul(rewardYield).div(rewardYieldDenominator));

            coreRebase(supplyDelta);
        }
    }

    function coreRebase(int256 supplyDelta) private returns (uint256) {
        uint256 epoch = block.timestamp;

        if (supplyDelta == 0) {
            emit LogRebase(epoch, _totalSupply);
            return _totalSupply;
        }

        if (supplyDelta < 0) {
            _totalSupply = _totalSupply.sub(uint256(-supplyDelta));
        } else {
            _totalSupply = _totalSupply.add(uint256(supplyDelta));
        }

        if (_totalSupply > MAX_SUPPLY) {
            _totalSupply = MAX_SUPPLY;
        }

        _gonsPerFragment = TOTAL_GONS.div(_totalSupply);

        nextRebase = epoch + rebaseFrequency;

        emit LogRebase(epoch, _totalSupply);
        return _totalSupply;
    }

    function manualRebase() external onlyOwner {
        require(!inSwap, "Try again");
        require(nextRebase <= block.timestamp, "Not in time");

        uint256 circulatingSupply = getCirculatingSupply();
        int256 supplyDelta = int256(circulatingSupply.mul(rewardYield).div(rewardYieldDenominator));

        coreRebase(supplyDelta);
        manualSync();
    }

    function setAutomatedMarketMakerPair(address _pair, bool _value) public onlyOwner {
        require(automatedMarketMakerPairs[_pair] != _value, "Value already set");

        automatedMarketMakerPairs[_pair] = _value;

        if (_value) {
            _markerPairs.push(_pair);
        } else {
            require(_markerPairs.length > 1, "Required 1 pair");
            for (uint256 i = 0; i < _markerPairs.length; i++) {
                if (_markerPairs[i] == _pair) {
                    _markerPairs[i] = _markerPairs[_markerPairs.length - 1];
                    _markerPairs.pop();
                    break;
                }
            }
        }

        emit SetAutomatedMarketMakerPair(_pair, _value);
    }

    function setInitialDistributionFinished(bool _value) external onlyOwner {
        require(initialDistributionFinished != _value, "Not changed");
        initialDistributionFinished = _value;
    }

    function setFeeExempt(address _addr, bool _value) external onlyOwner {
        require(_isFeeExempt[_addr] != _value, "Not changed");
        _isFeeExempt[_addr] = _value;
    }

    function setTargetLiquidity(uint256 target, uint256 accuracy) external onlyOwner {
        targetLiquidity = target;
        targetLiquidityDenominator = accuracy;
    }

    function setSwapBackSettings(bool _enabled, uint256 _num, uint256 _denom) external onlyOwner {
        swapEnabled = _enabled;
        gonSwapThreshold = TOTAL_GONS.div(_denom).mul(_num);
    }

    function setFeeReceivers(address _liquidityReceiver, address _treasuryReceiver, address _riskFreeValueReceiver, address _futureEcosystemReceiver, address _operationReceiver, address _xRKTLReceiver, address _burnReceiver) external onlyOwner {
        liquidityReceiver = _liquidityReceiver;
        treasuryReceiver = _treasuryReceiver;
        riskFreeValueReceiver = _riskFreeValueReceiver;
        operationsReceiver = _operationReceiver;
        xRKTLReceiver = _xRKTLReceiver;
        futureEcosystemReceiver = _futureEcosystemReceiver;
        burnReceiver = _burnReceiver;
    }

    function setFees(uint8 _feeKind, uint256 _total, uint256 _liquidityFee, uint256 _riskFreeValue, uint256 _treasuryFee, uint256 _feeFee, uint256 _operationFee, uint256 _xRKTLFee, uint256 _burnFee) external onlyOwner {
        require (_total <= MAX_FEE_RATE, "buyFee is not allowed");
        require (_liquidityFee + _riskFreeValue + _treasuryFee + _feeFee + _operationFee + _xRKTLFee + _burnFee == 100, "subFee is not allowed");

        totalFee[0] = _total * 100;
        liquidityFee[_feeKind] = _total * _liquidityFee;
        treasuryFee[_feeKind] = _total * _treasuryFee;
        riskFeeValueFee[_feeKind] = _total * _riskFreeValue;
        ecosystemFee[_feeKind] = _total * _feeFee;
        operationsFee[_feeKind] = _total * _operationFee;
        xRKTLFee[_feeKind] = _total * _xRKTLFee;
        burnFee[_feeKind] = _total * _burnFee;
    }

    function clearStuckBalance(address _receiver) external onlyOwner {
        uint256 balance = address(this).balance;
        payable(_receiver).transfer(balance);
    }

    function rescueToken(address tokenAddress, uint256 tokens) external onlyOwner returns (bool success) {
        return ERC20Detailed(tokenAddress).transfer(msg.sender, tokens);
    }
    
    function setRouterAddress(address _router) external onlyOwner {
        router = IDEXRouter(_router);
    }

    function setAutoRebase(bool _autoRebase) external onlyOwner {
        require(autoRebase != _autoRebase, "Not changed");
        autoRebase = _autoRebase;
    }

    function setRebaseFrequency(uint256 _rebaseFrequency) external onlyOwner {
        require(_rebaseFrequency <= MAX_REBASE_FREQUENCY, "Too high");
        rebaseFrequency = _rebaseFrequency;
    }

    function setRewardYield(uint256 _rewardYield, uint256 _rewardYieldDenominator) external onlyOwner {
        rewardYield = _rewardYield;
        rewardYieldDenominator = _rewardYieldDenominator;
    }

    function setFeesOnNormalTransfers(bool _enabled) external onlyOwner {
        require(feesOnNormalTransfers != _enabled, "Not changed");
        feesOnNormalTransfers = _enabled;
    }

    function setNextRebase(uint256 _nextRebase) external onlyOwner {
        nextRebase = _nextRebase;
    }

    function setMaxSellTransaction(uint256 _maxTxn) external onlyOwner {
        maxSellTransactionAmount = _maxTxn;
    }

    function setJustBusiness(address _add, bool _business) external onlyOwner {
        justBusinessList[_add] = _business;
    }

    event SwapBack(uint256 contractTokenBalance,uint256 amountToLiquify,uint256 amountToRFV,uint256 amountToTreasury);
    event SwapAndLiquify(uint256 tokensSwapped, uint256 avaxReceived, uint256 tokensIntoLiqudity);
    event LogRebase(uint256 indexed epoch, uint256 totalSupply);
    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);

    receive() payable external {}

    fallback() payable external {}
}