import React from 'react';
import { Link } from '@reach/router';
import { createGlobalStyle } from 'styled-components';
import Reveal from 'react-awesome-reveal';
import { fadeIn, fadeInUp } from '../utils';
import LogoAnim from './LogoAnim';
// import Particles from '../components/Particles';
const GlobalStyles = createGlobalStyle`
  .header-logo {
    position: absolute;
    top: 0;
    left: 0;
    @media only screen and (max-width: 992px) {
      position: relative;
      margin-right: auto;
    }
  }
  .banner-container {
    position: relative;
    height: 800px;
    display: flex;
    align-items: center;
    @media only screen and (max-width: 992px) {
      height: 100%;
      flex-direction: column;
      gap: 30px;
    }
  }
  .banner-content {
    z-index: 999;
    @media only screen and (max-width: 992px) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  }
  .banner-logo {
    position: absolute;
    bottom: -10px;
    right: 0px;
    width: 550px;
    @media only screen and (max-width: 992px) {
      position: relative;
      width: 400px;
    }
  }
  .banner-title {
    font-family: "CenturyGothic";
    font-style: normal;
    font-weight: 700;
    font-size: 42px;
    margin-bottom: 80px;
    @media only screen and (max-width: 1200px) {
      font-size: 36px;
    }
    @media only screen and (max-width: 992px) {
      margin-top: 64px;
      margin-bottom: 36px;
      text-align: center;
    }
  }
  .banner-subtitle {
    font-family: "CenturyGothic";
    margin-top: -24px;
    text-align: center;
    // margin-bottom: 50px;
    @media only screen and (max-width: 1200px) {
      font-size: 16px;
    }
    @media only screen and (max-width: 992px) {
      // margin-bottom: 30px;
      text-align: center;
    }
  }
  .banner-subtitle-tail {
    font-family: "CenturyGothic";
    margin-bottom: 50px;
    text-align: right;
    @media only screen and (max-width: 1200px) {
      font-size: 30px;
    }
    @media only screen and (max-width: 992px) {
      margin-bottom: 30px;
      text-align: center;
    }
  }
  .home-header-btns {
    display: flex;
    justify-content: start;
    gap: 30px;
    @media only screen and (max-width: 1024px) {
      flex-direction: column;
      align-items: center;
    }
  }
  .logo-anim {
    width: 550px;
    position: absolute;
    right: 0;
  }
  .certik-logo-box  {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: start;
    cursor: pointer;
    margin-left: 40px;
    margin-bottom: 40px;
    margin-top: 40px;
    @media only screen and (max-width: 768px) {
      flex-direction: column;
      margin-left: auto;
      margin-right: auto;
    }
    .certik-logo {
      border-radius: 10px;
    }
    
    .divider {
      padding-right: 10px;
      padding-left: 10px;
      display: block;
      color: #fff;
      font-weight: 400;
      @media only screen and (max-width: 768px) {
        display: none;
      }
    }
  }
  .logo-img {
    cursor: pointer;
    margin: auto;
    margin-top: 120px;
    width: 36rem;
    @media only screen and (max-width: 1200px) {
      font-size: 16px;
    }
    @media only screen and (max-width: 992px) {
      margin-top: 80px;
    }
  }
  .list-text {
    list-style: "- ";    
  }
`;

const slidermain = () => (
  <div className="container banner-container">
    <GlobalStyles />
    <div className='d-flex flex-column'>
      <img className="logo-img" alt='' src={'/img/logo.svg'} />
      <h3 className="banner-subtitle">AUTO-STAKING PROTOCOL</h3>
      {/* <h5 style={{lineHeight: '36px'}}>BRIEFING</h5> */}
      <ul className='list-text'>
         <li>Guaranteed Highest Fixed APY 361,404.26%</li>
         <li>Earn; Super high fixed interest of 2.27% per day</li>
         <li>Lock; World class "Lock to Earn" protocol</li>
         <li>Staking & Compounding are handled automatically through your wallet</li>
         <li>Defi 3.0 Multichain Farming to support high rewards</li>
         <li>Deflationary model; 1% of trading volume is burned</li>
         <li>Cash Out; Convert your crypto back to cash</li>
         <li>Provides the best security, and healthy chart like no other coin</li>
         <li>World's best Anti-Dump Mechanism to keep your investment safe</li>
      </ul>
      <div className='certik-logo-box'>
        <span className='flex flex-row'><p style={{marginTop: '12px'}}>Audited by </p><a href="/audit.pdf" target="_blank" rel="noreferrer"><img src="/img/audit_.png" className='certik-logo mx-2' alt="" width="160px"></img></a></span>
      </div>
      <div className="home-header-btns">
        <a href="https://rocket-launch.gitbook.io/rocketlaunch/" target="_blank" rel="noreferrer" className='btn-main btn3 lead'>&nbsp;WhitePaper&nbsp;</a>
        <Link to="/rktl-ico" className='btn-main btn3 lead'>Enter Presale</Link>
      </div>
    </div>
    <div className='banner-logo'>
      <LogoAnim />
    </div>
  </div>
);
export default slidermain;