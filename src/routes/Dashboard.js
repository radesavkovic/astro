import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from '@reach/router';
import { useSelector } from 'react-redux';
import { Reveal } from 'react-awesome-reveal';
import Chip from '@mui/material/Chip';
import { createGlobalStyle } from 'styled-components';
import { fadeInUp, numberWithCommas } from '../components/utils';
import RKTLChart from '../components/Dashboard/RKTLChart';
import RebaseBar from '../components/Dashboard/RebaseBar';
import * as selectors from '../store/selectors';
import { LoadingSkeleton } from '../components/utils';
import { getRebaseFrequency, getNextRebase, getMarketCap, getTotalEarned } from '../core/web3';
import { getTokenHolders, getRKTLPrice } from '../core/axios';
import { config, def_config } from '../core/config';

const GlobalStyles = createGlobalStyle`
  .dashboard-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    background-size: cover !important;
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
      color: rgb(188 195 207);
    }
    .sub-title {
      width: 100%;
      text-align: left;
      color: white;
    }
  }

  .rebase-card {
    padding: 30px 60px;
    @media only screen and (max-width: 1500px) and (min-width: 1200px) {
      padding: 30px 30px;
    }
    @media only screen and (max-width: 768px) {
      padding: 10px;
    }
  }

  .progress-content {
    @media only screen and (max-width: 768px) {
      width: 80% !important;
    }
  }

  .rktl-text {
    color: rgb(255, 184, 77) !important;
    font-weight: bold;
    font-size: 24px;
  }

  .rebase-text {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    @media only screen and (min-width: 769px) {
      height: 100%;
    }
  }

  .claim-value {
    color: #4ed047 !important;
    font-size: 22px;
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

  .rebase-bar {
    width: 38%;
    @media only screen and (max-width: 768px) {
      width: 100%;
    }
  }

  .rebase-body {
    width: 62%;
    @media only screen and (max-width: 768px) {
      width: 100%;
    }
  }
`;


const Dashboard = (props) => {
  const APY = def_config.APY;
  const dailyRate = def_config.DPR;
  const rebaseRate = def_config.REBASE_RATE;
  const balance = useSelector(selectors.userBalance);
  const wallet = useSelector(selectors.userWallet);
  const web3 = useSelector(selectors.web3State);
  const [dailyRKTL, setDailyRKTL] = useState('');
  const [chartType, setChartType] = useState(0);
  const [rebaseInterval, setRebaseInterval] = useState(0);
  const [nextRebase, setNextRebase] = useState(0);
  const [nextRebaseAmount, setNextRebaseAmount] = useState('');
  const [rktlPrice, setRKTLPrice] = useState('');
  const [marketCap, setMarketCap] = useState('');
  const [claimRKTL, setClaimRKTL] = useState('');
  const [tokenHolders, setTokenHolders] = useState('');
  const [totalEarned, setTotalEarned] = useState('');
  const [earnedRate, setEarnedRate] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const initialize = useCallback(async () => {
    console.log('[Wallet] = ', wallet);
    if (!web3) {
      return;
    }
    setLoading(true);
    let nowRKTLPrice = 0;
    let result = await getRKTLPrice();
    if (result.success) {
      nowRKTLPrice = result.rktlPrice;
      setRKTLPrice(result.rktlPrice);
    }
    result = await getTokenHolders();
    if (result.success) {
      setTokenHolders(result.count);
    }
    result = await getMarketCap(nowRKTLPrice);
    if (result.success) {
      setMarketCap(result.marketCap);
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

    let amount = Number(balance.rktlBalance) * rebaseRate;
    setNextRebaseAmount(amount);
    amount = Number(balance.rktlBalance) * 0.01;
    setClaimRKTL(amount);
    setDailyRKTL(Number(balance.rktlBalance) * dailyRate);
    
    setLoading(false);
  }, [web3, wallet, balance.rktlBalance, dailyRate, rebaseRate]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleChart = (type) => {
    setChartType(type);
  }

  return (
    <div className='page-container dashboard-container'>
      <GlobalStyles />
      <div className='row full-width'>
        <div className='col-md-12'>
          <Reveal keyframes={fadeInUp} className='onStep' delay={0} duration={800} triggerOnce>
            <div className='dashboard-title'>
              <span className='fs-18 f-century fw-bold ls-1 mb-2 ms-4'>COMMUNITY PERFORMANCE</span>
            </div>
          </Reveal>
        </div>
        <div className='col-md-12'>
          <Reveal keyframes={fadeInUp} className='onStep' delay={0} duration={800} triggerOnce>
            <div className='full-card'>
              <div className='row row-gap-1'>
                <div className='col-xl-6 col-lg-12'>
                  <div className='row h-100 justify-between row-gap-1'>
                    <div className='col-md-6'>
                      <div className='main-card'>
                        <div className='flex justify-between'>
                          <p className='fs-16'>RKTL Price</p>
                          <p className="card-chip fs-12 up">+82.00%</p>
                        </div>
                        <p className='card-value mt-3 mb-3'>{loading || rktlPrice === '' ? <LoadingSkeleton /> : '$' + numberWithCommas(rktlPrice, 4)}</p>
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className='main-card'>
                        <p className='fs-16'>Market Cap</p>
                        <p className='card-value bold text-white mt-3 mb-3'>{loading || marketCap === '' ? <LoadingSkeleton /> : '$' + numberWithCommas(marketCap)}</p>
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className='main-card'>
                        <p className='fs-16'>APY</p>
                        <p className='card-value text-white'>{numberWithCommas(APY * 100)}%</p>
                        <p className='card-value type-3'>Daily % Rate (DPR): ~{numberWithCommas(dailyRate * 100)}%</p>
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className='main-card'>
                        <p className='fs-16'>Total Holders</p>
                        <p className='card-value text-white mt-3 mb-3'>{loading || tokenHolders === '' ? <LoadingSkeleton /> : numberWithCommas(tokenHolders)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='col-xl-6 col-lg-12'>
                  <div className='main-card rebase-card'>
                    <div className='row full-height'>
                      <div className='d-flex rebase-bar'>
                        <RebaseBar nextRebase={Number(nextRebase) * 1000} interval={Number(rebaseInterval)} />
                      </div>
                      <div className='full-height rebase-body'>
                        <div className='rebase-text'>
                          <div className='flex flex-column'>
                            <p className="text-center f-century fs-16">NEXT REBASE AMOUNT</p>
                            <p className='text-center fs-26 fw-bold mb-0'>{loading || nextRebaseAmount === '' || rktlPrice === '' ? <LoadingSkeleton /> : '$' + numberWithCommas(nextRebaseAmount * rktlPrice)}</p>
                            <p className='text-center fs-12 text-gray mb-0'>{loading || nextRebaseAmount === '' ? <LoadingSkeleton /> : numberWithCommas(nextRebaseAmount) + ' RKTL'}</p>
                          </div>
                          <button className='d-flex btn-main btn-claim fs-16'>Claim (1%)&nbsp;&nbsp; {loading ? <LoadingSkeleton width={50} /> : '($' + numberWithCommas(claimRKTL * rktlPrice) + ')'}</button>
                          <p className='fs-14 text-center'>Today's percentage claim is set to 1% to maximize your growth.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        <div className='col-md-12 mt-4'>
          <Reveal keyframes={fadeInUp} className='onStep' delay={300} duration={800} triggerOnce>
            <div className='dashboard-title'>
              <span className='fs-18 f-century fw-bold ls-1 mb-2 ms-4'>YOUR ACTIVITY</span>
            </div>
          </Reveal>
        </div>
        <div className='col-md-12'>
          <Reveal keyframes={fadeInUp} className='onStep' delay={300} duration={800} triggerOnce>
            <div className='full-card'>
              <div className='row row-gap-1'>
                <div className='col-xl-6 col-lg-12 align-items-stretch'>
                  <div className='row h-100 justify-between row-gap-1'>
                    <div className='col-md-6'>
                      <div className='main-card'>
                        <p className='fs-16'>Your Earnings / Daily</p>
                        <p className='card-value bold fs-40'>{loading || dailyRKTL === '' || rktlPrice === '' ? <LoadingSkeleton /> : `$${numberWithCommas(dailyRKTL * rktlPrice)}`}</p>
                        <p className='card-value type-3'>{loading || dailyRKTL === '' ? <LoadingSkeleton /> : `${numberWithCommas(dailyRKTL)} RKTL`}</p>
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className='main-card'>
                        <p className='fs-16'>APY</p>
                        <p className='card-value text-white'>{numberWithCommas(APY * 100)}%</p>
                        <p className='card-value type-3'>Daily % Rate (DPR): ~{numberWithCommas(dailyRate * 100)}%</p>
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className='main-card'>
                        <div className='flex justify-between'>
                          <p className='fs-16'>Total Earned</p>
                          <p className="card-chip fs-12 up">{loading ? '' : `+${numberWithCommas(earnedRate)}`}%</p>
                        </div>
                        <p className='card-value'>{loading ? <LoadingSkeleton /> : `$${numberWithCommas(Number(totalEarned)) * rktlPrice}`}</p>
                        <p className='card-value type-3'>{loading ? <LoadingSkeleton /> : `${numberWithCommas(Number(totalEarned))} RKTL`}</p>
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className='main-card'>
                        <p className='fs-16'>Your Balance</p>
                        <p className='card-value'>{loading ? <LoadingSkeleton /> : `$${numberWithCommas(Number(balance.rktlBalance) * rktlPrice)}`}</p>
                        <p className='card-value type-3'>{loading ? <LoadingSkeleton /> : `${numberWithCommas(Number(balance.rktlBalance))} RKTL`}</p>
                      </div>
                    </div>
                    <div className='col-md-6'>
                      {/* <a href={`https://traderjoexyz.com/trade?inputCurrency=AVAX&outputCurrency=${config.RKTLAddress}`} className='btn-main btn5 full-width fs-16' target='_blank' rel="noreferrer">DEX Charts</a> */}
                      <a href={`https://pancakeswap.finance/swap?inputCurrency=BNB&outputCurrency=${config.RKTLAddress}`} className='btn-main btn5 full-width fs-16' target='_blank' rel="noreferrer">DEX Charts</a>
                    </div>
                    <div className='col-md-6'>
                      <button className='btn-main full-width fs-16' onClick={() => navigate('/swap')}>Buy RKTL</button>
                    </div>
                  </div>
                </div>
                <div className='col-xl-6 col-lg-12 align-items-stretch'>
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
                      <div className='col-md-12' style={{ height: '310px' }}>
                        <RKTLChart isChangePositive={true} />
                      </div>
                    </div>
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

export default Dashboard;