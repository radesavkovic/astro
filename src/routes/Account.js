import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from '@reach/router';
import { useSelector } from 'react-redux';
import { createGlobalStyle } from 'styled-components';
import { Reveal } from 'react-awesome-reveal';
import { Accordion } from "react-bootstrap";
import Chip from '@mui/material/Chip';
import RebaseBar from '../components/Dashboard/RebaseBar';
import RKTLChart from '../components/Dashboard/RKTLChart';
import { fadeInUp, numberWithCommas } from '../components/utils';
import { LoadingSkeleton } from '../components/utils';
import { getRebaseFrequency, getNextRebase, getTotalEarned } from '../core/web3';
import { getRKTLPrice } from '../core/axios';
import * as selectors from '../store/selectors';
import { config, def_config } from '../core/config';

const GlobalStyles = createGlobalStyle`
  .dashboard-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    background-size: 100% !important;
    background-position-x: center !important;
    padding: 20px;
    @media only screen and (max-width: 1200px) {
      .col {
        width: 100%;
      }
    }
  }

  .dashboard-title {
    width: fit-content;
    text-overflow: ellipsis;
    white-space: nowrap;
    h3 {
      line-height: 2rem;
    }
  }

  .community-perform {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .progress-content {
    width: 90% !important;
  }

  .calc-card {
    padding: 10px 20px;
    text-align: left;
  }

  .claim-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    p {
      margin: 1px;
      color: #BCC3CF;
    }
    .sub-title {
      width: 100%;
      text-align: left;
      color: white;
      font-weight: 500;
    }
  }

  .rktl-text {
    color: rgb(255, 184, 77) !important;
    font-weight: bold;
    font-size: 24px;
  }

  .claim-value {
    color: #4ed047 !important;
    font-size: 22px;
  }

  .whale-content {
    .accordion-item {
      background-color: transparent;
      border-color: #5947FF;
    }
    .accordion-item:first-of-type .accordion-button {
      border-top-left-radius: 0.3rem;
      border-top-right-radius: 0.3rem;
      font-family: 'Poppins';
      font-size: 16px;
      font-weight: 500;
    }
    .accordion-button {
      padding: 0px 20px;
      background: #151B34;
      color: white;
      &::after {
        background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgOEgxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik04IDBMOCAxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=");
      }
      &[aria-expanded="true"]::after {
        background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgOEgxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=");
      }
      &:focus {
        box-shadow: none;
      }
    }
    .accordion-body {
      background: #151B34;
      border-top: solid 1px white;
      border-bottom-left-radius: 0.25rem;
      border-bottom-right-radius: 0.25rem;
      border-color: #5947FF;
    }
  }

  .claim-label {
    font-family: "Poppins";
    font-weight: 500;
    color: #BCC3CF;
  }

  .MuiChip-label {
    font-family: "CenturyGothic";
    font-size: 16px;
    letter-spacing: 1px;
  }

  .btn-claim {
    width: calc(100% - 50px);
    justify-content: center;
    margin-left: 25px;
    margin-right: 25px;
    white-space: nowrap;
  }
  .btn-activity {
    margin-left: 10px;
    margin-right: 10px;
    padding: 14px 70px;
    font-size: 16px;
  }
  .tax-guide-left {
    border-left: solid 2px #464d62;
    @media only screen and (max-width: 768px) {
      border: none;
    }
  }
`;

const Account = (props) => {
  const APY = def_config.APY;
  const dailyRate = def_config.DPR;
  const rebaseRate = def_config.REBASE_RATE;
  const balance = useSelector(selectors.userBalance);
  const wallet = useSelector(selectors.userWallet);
  const web3 = useSelector(selectors.web3State);
  const [dailyRKTL, setDailyRKTL] = useState('');
  const [chartType, setChartType] = useState(0);
  const [rktlPrice, setRKTLPrice] = useState(0);
  const [totalEarned, setTotalEarned] = useState('');
  const [earnedRate, setEarnedRate] = useState('');
  const [rebaseInterval, setRebaseInterval] = useState(0);
  const [nextRebase, setNextRebase] = useState(0);
  const [nextRebaseAmount, setNextRebaseAmount] = useState('');
  const [claimRKTL, setClaimRKTL] = useState('');
  const [ROI_rate, setROIRate] = useState('');
  const [ROI_rateUSD, setROIRateUSD] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const getInitAmount = useCallback(async () => {
    console.log('[Wallet] = ', wallet);
    if (!web3) {
      return;
    }

    setLoading(true);
    const ROI = (((1 + rebaseRate) ** 48) ** 30) - 1;
    setROIRate(ROI);
    let nRKTLPrice = 0;
    let result = await getRKTLPrice();
    if (result.success) {
      nRKTLPrice = result.rktlPrice;
      setRKTLPrice(result.rktlPrice);
    }

    result = await getTotalEarned();
    if (result.success) {
      setTotalEarned(result.total_earned);
      setEarnedRate(result.earned_rate);
    }
    result = await getRebaseFrequency();
    if (result.success) {
      setRebaseInterval(result.rebaseFrequency);
    }
    result = await getNextRebase();
    if (result.success) {
      setNextRebase(result.nextRebase);
    }

    setDailyRKTL(Number(balance.rktlBalance) * dailyRate);

    let amount = Number(balance.rktlBalance) * rebaseRate;
    setNextRebaseAmount(amount);
    amount = Number(balance.rktlBalance) * 0.01;
    setClaimRKTL(amount);
    amount = Number(balance.rktlBalance) * ROI_rate * nRKTLPrice;
    setROIRateUSD(amount);

    setLoading(false);
  }, [web3, ROI_rate, wallet, balance.rktlBalance, dailyRate, rebaseRate]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, []);

  useEffect(() => {
    getInitAmount();
  }, [getInitAmount]);

  const handleChart = (type) => {
    setChartType(type);
  }
  return (
    <div className='page-container dashboard-container'>
      <GlobalStyles />
      <div className="row full-width">
        <div className='col col-md-6 col-sm-12 flex flex-column pb-3'>
          <Reveal keyframes={fadeInUp} className='onStep' delay={0} duration={800} triggerOnce>
            <div className='dashboard-title'>
              <span className='fs-18 f-century fw-bold ls-1 mb-2 ms-4'>YOUR ACCOUNT ACTIVITY</span>
            </div>
          </Reveal>
          <Reveal keyframes={fadeInUp} className='full-card full-height onStep' delay={400} duration={1000} triggerOnce>
            <div className='full-height flex flex-column gap-5'>
              <div className='row'>
                <div className='col-md-6 pb-3'>
                  <div className='main-card'>
                    <p>Your Earnings / Daily</p>
                    <p className='card-value bold fs-40'>{loading ? <LoadingSkeleton /> : `$${numberWithCommas(dailyRKTL * rktlPrice)}`}</p>
                    <p className='card-value type-3'>{loading ? <LoadingSkeleton /> : `${numberWithCommas(dailyRKTL)} RKTL`}</p>
                  </div>
                </div>
                <div className='col-md-6 pb-3'>
                  <div className='main-card'>
                    <p>APY</p>
                    <p className='card-value text-white'>{numberWithCommas(APY * 100)}%</p>
                    <p className='card-value type-3'>Daily % Rate (DPR): ~{numberWithCommas(dailyRate * 100)}%</p>
                  </div>
                </div>
                <div className='col-md-6 pb-3'>
                  <div className='main-card'>
                    <div className='flex justify-between'>
                      <p>Total Earned</p>
                      <span className="card-chip up">{loading ? '' : `+${numberWithCommas(earnedRate)}`}%</span>
                    </div>
                    <p className='card-value'>{loading ? <LoadingSkeleton /> : `$${numberWithCommas(Number(totalEarned)) * rktlPrice}`}</p>
                    <p className='card-value type-3'>{loading ? <LoadingSkeleton /> : `${numberWithCommas(Number(totalEarned))} RKTL`}</p>
                  </div>
                </div>
                <div className='col-md-6 pb-3'>
                  <div className='main-card'>
                    <p>Your Balance</p>
                    <p className='card-value'>{loading ? <LoadingSkeleton /> : `$${numberWithCommas(Number(balance.rktlBalance) * rktlPrice)}`}</p>
                    <p className='card-value type-3'>{loading ? <LoadingSkeleton /> : `${numberWithCommas(Number(balance.rktlBalance))} RKTL`}</p>
                  </div>
                </div>
                <div className='col-md-12'>
                  <div className='main-card'>
                    <div className='row full-width full-height'>
                      <div className='col-md-12 mt-2 mb-2 flex flex-column flex-md-row justify-between align-items-center'>
                        <p className='fs-16 f-semi-b text-white mb-0 lh-1'>4,567.95 RKTL</p>
                        <div className='flex gap-2'>
                          <Chip label="01M" variant={chartType === 0 ? 'filled' : ''} onClick={() => handleChart(0)} />
                          <Chip label="06M" variant={chartType === 1 ? 'filled' : ''} onClick={() => handleChart(1)} />
                          <Chip label="01Y" variant={chartType === 2 ? 'filled' : ''} onClick={() => handleChart(2)} />
                          <Chip label="All" variant={chartType === 3 ? 'filled' : ''} onClick={() => handleChart(3)} />
                        </div>
                      </div>
                      <div className='col-md-12 ' style={{ height: '310px' }}>
                        <RKTLChart isChangePositive={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='full-height flex justify-center align-items-center mb-4'>
                {/* <a href={`https://traderjoexyz.com/trade?inputCurrency=AVAX&outputCurrency=${config.RKTLAddress}`} className='btn-main btn5 btn-activity' target='_blank' rel="noreferrer">DEX Charts</a> */}
                <a href={`https://pancakeswap.finance/swap?inputCurrency=BNB&outputCurrency=${config.RKTLAddress}`} className='btn-main btn5 btn-activity' target='_blank' rel="noreferrer">DEX Charts</a>
                <button className='btn-main btn-activity' onClick={() => navigate('/swap')}>Buy RKTL</button>
              </div>
            </div>
          </Reveal>
        </div>
        <div className='col col-md-6 col-sm-12 flex flex-column pb-3'>
          <Reveal keyframes={fadeInUp} className='col col-md-6 col-sm-12 onStep' delay={0} duration={800} triggerOnce>
            <div className='dashboard-title'>
              <span className='fs-18 f-century fw-bold ls-1 mb-2 ms-4'>REBASE & CLAIM ACTIVITY</span>
            </div>
          </Reveal>
          <Reveal className='full-card full-height onStep' keyframes={fadeInUp} delay={400} duration={1000} triggerOnce>
            <div className='row'>
              <div className='col-md-5'>
                <div className='main-card'>
                  <RebaseBar nextRebase={Number(nextRebase) * 1000} interval={Number(rebaseInterval)} />
                  <p className="text-center fs-16 pt-1 mb-0">NEXT REBASE AMOUNT</p>
                  <p className='fs-24 font-bold text-center mb-0'>{loading ? <LoadingSkeleton /> : '$' + numberWithCommas(nextRebaseAmount * rktlPrice)}</p>
                  <p className='f-century-b fs-14 text-gray text-center'>{loading ? <LoadingSkeleton /> : numberWithCommas(nextRebaseAmount) + ' RKTL'}</p>
                </div>
              </div>
              <div className='col-md-7'>
                <div className='claim-card full-height'>
                  <p className='sub-title fs-16'>Your Daily Claim Quote:</p>
                  <p className='text-left fs-14 text-white'>Today's percentage claim is set to 1% to maximize your growth.</p>
                  <div className='my-3 full-width'>
                    <div className='main-card new-card full-width flex flex-row justify-between align-items-center'>
                      <div className='flex align-items-center gap-2'>
                        <img src="/img/rktl-icon.png" alt='' width="40px" height="40px"></img>
                        <p className='fs-16 text-white f-medium'>CLAIM RKTL</p>
                      </div>
                      <p className='fs-28 rktl-text'>{loading ? <LoadingSkeleton /> : numberWithCommas(claimRKTL)}</p>
                    </div>
                  </div>
                  <div className='flex flex-column full-width'>
                    <div className='flex justify-between'>
                      <p className='fs-15 d-flex gap-1'>Your Earnings/Daily: <p className='fs-15 text-white'>2.27%</p></p>
                      <p className='fs-15 text-white'>{loading ? <LoadingSkeleton /> : numberWithCommas(Number(balance.rktlBalance) * 0.0227)}</p>
                    </div>
                    <div className='flex justify-between'>
                      <p className='fs-15 d-flex gap-1'>Recommended Claim: <p className='fs-15 text-white'>1%</p></p>
                      <p className='fs-15 text-white'>{loading ? <LoadingSkeleton /> : numberWithCommas(Number(balance.rktlBalance) * 0.1)}</p>
                    </div>
                    <div className='flex justify-between'>
                      <p className='fs-15 d-flex gap-1'>Claim Tax: <p className='fs-15 text-white'>12%</p></p>
                      <p className='fs-15 text-white'>{loading ? <LoadingSkeleton /> : numberWithCommas(Number(balance.rktlBalance) * 0.012)}</p>
                    </div>
                    <hr className='my-2' />
                  </div>
                  <div className='full-width flex justify-between align-items-center'>
                    <div className='flex flex-column'>
                      <p className='fs-15'>Estimated Amount</p>
                      <p className='fs-15'>You'll Receive in $BUSD</p>
                    </div>
                    <span className='fs-26 text-green'>{loading ? <LoadingSkeleton /> : '$' + numberWithCommas(claimRKTL * rktlPrice)}</span>
                  </div>
                  <div className='full-width flex flex-column justify-center mt-2'>
                    <button className='d-flex btn-main fs-16 full-width justify-center'>Claim 1%&nbsp;&nbsp; {loading ? <LoadingSkeleton width={50} /> : '($' + numberWithCommas(claimRKTL * rktlPrice) + ')'}</button>
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className='claim-card mt-3 px-3'>
                  <Accordion className='whale-content full-width pt-2 pb-4'>
                    <Accordion.Item>
                      <Accordion.Header>Tax / Sales Guide</Accordion.Header>
                      <Accordion.Body className="px-3 py-1">
                        <div className='row'>
                          <div className='col-md-6 col-sm-12 my-2'>
                            <div className='d-flex flex-column'>
                              <p className='text-white'>Buy / Sell Tax:</p>
                              <div className='flex justify-between'>
                                <p>Buy Tax</p>
                                <p className='text-white'>10%</p>
                              </div>
                              <div className='flex justify-between'>
                                <p>Sell Tax</p>
                                <p className='text-white'>12%</p>
                              </div>
                            </div>
                          </div>
                          <div className='col-md-6 col-sm-12 tax-guide-left my-2'>
                            <div className='d-flex flex-column'>
                              <p className='text-white'>Limit Sales:</p>
                              <div className='flex justify-between'>
                                <p>Max Sales Transaction</p>
                                <p className='text-white'>$ 3000 USD</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </div>
              </div>
              <div className='col-md-12'>
                <div className="flex flex-column gap-3 px-3">
                  <div className='flex justify-between'>
                    <label className='claim-label'>Current RKTL Price</label>
                    <p className='f-medium mb-0 text-right'>{loading ? <LoadingSkeleton /> : '$ ' + numberWithCommas(rktlPrice, 4) + ' USD'}</p>
                  </div>
                  <div className='flex justify-between'>
                    <label className='claim-label'>Next Reward Amount</label>
                    <p className='f-medium mb-0 text-yellow text-right'>{loading ? <LoadingSkeleton /> : numberWithCommas(nextRebaseAmount) + ' RKTL'}</p>
                  </div>
                  <div className='flex justify-between'>
                    <label className='claim-label'>Next Reward Amount (in USD)</label>
                    <p className='f-medium mb-0 text-right'>{loading || rktlPrice === '' ? <LoadingSkeleton /> : '$ ' + numberWithCommas(nextRebaseAmount * rktlPrice) + ' USD'}</p>
                  </div>
                  <div className='flex justify-between'>
                    <label className='claim-label'>Next Reward Yield</label>
                    <p className='f-medium mb-0 text-right'>{loading ? <LoadingSkeleton /> : numberWithCommas(rebaseRate * 100, 5) + ' %'}</p>
                  </div>
                  <div className='flex justify-between'>
                    <label className='claim-label'>ROI (30-Day Rate)</label>
                    <p className='f-medium mb-0 text-right'>{loading ? <LoadingSkeleton /> : numberWithCommas(ROI_rate * 100, 2)}</p>
                  </div>
                  <div className='flex justify-between'>
                    <label className='claim-label'>ROI (30-Day Rate in USD)</label>
                    <p className='f-medium mb-0 text-right'>{loading ? <LoadingSkeleton /> : '$ ' + numberWithCommas(ROI_rateUSD, 2) + ' USD'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div >
  );
};

export default Account;