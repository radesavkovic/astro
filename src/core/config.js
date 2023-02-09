var presale_abi = require("./ABI/PresaleFactory.json");
var RKTL_abi = require('./ABI/RKTL.json')
var Avax_abi = require("./ABI/Avax.json");
var usdc_abi = require("./ABI/USDC.json");
var avaxRKTL_abi = require("./ABI/avaxRKTL.json");
var joerouter_abi = require("./ABI/joerouter_abi.json");

export const config = {
    chainId: 56,
    mainNetUrl: 'https://bsc-dataseed1.ninicoin.io',
    PresaleFactoryAddress : "0x1F3C8CB3F18ffbD41d02f7770aDd3bBe046EA9ae", // Avalanche
    PresaleFactoryAbi : presale_abi,
    AvaxAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // Avalanche
    AvaxAbi: Avax_abi,
    RKTLAddress: '0x64394E062b1e5cc2C4877b526783dc6d2Fcd33B7', // Avalanche - 0x9d77cceEBDA1De9A6E8517B4b057c1c2F89C8444
    RKTLAbi: RKTL_abi,
    USDCAddress: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // Avalanche
    USDCAbi: usdc_abi,    
    JoeRouterAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    JoeRouterAbi : joerouter_abi,
    JoeFactoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',    
    avaxRKTLPair: "0xfd9eA09A1F205ba6e147096181F7Fb71528c6451", // <- AVAX:RKTL Avalanche - Test USDC:RKTL 0xfd9eA09A1F205ba6e147096181F7Fb71528c6451
    avaxRKTLAbi: avaxRKTL_abi,
    INFURA_ID: 'e6943dcb5b0f495eb96a1c34e0d1493e'
}

export const def_config = {
    REBASE_RATE: 0.0004729,
    DPR: 0.0227,
    APY: 3614.0426,
    SWAP_FEE: 0.053,
    AUTO_SLIPPAGE: 1,
    MAX_PRESALE_AMOUNT: 4000000
}