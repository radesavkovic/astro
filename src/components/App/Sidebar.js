import { useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from '@reach/router';
import { useMediaQuery } from 'react-responsive';
import { createGlobalStyle } from 'styled-components';
import { LoadingSkeleton } from '../../components/utils';
import { getMarketCap } from '../../core/web3';
import * as selectors from '../../store/selectors';
import { config } from '../../core/config';
import { getRKTLPrice } from '../../core/axios';
import { numberWithCommas } from '../utils';
import LogoAnim from '../Landing/LogoAnim';


const GlobalStyles = createGlobalStyle`
  .social-icons span {
    text-shadow: none;
    color: #fff !important;
    padding: 5px 10px 8px;
    text-align: center;
    font-size: 22px;
    border-radius: 5px;
    margin: 16px;
  }

  .menu-text {
    font-family: "Poppins";
    font-weight: 400;
    font-size: 16px;
    @media only screen and (max-width: 768px) {
      margin-left: 8px !important;
    }
  }
`;

const path_list = ['', 'home', 'dashboard', 'account', 'swap', 'admin'];

const Sidebar = (props) => {
  const [navSelected, setNavSelected] = useState('dashboard');
  const [isAdmin, setAdmin] = useState(false);
  const [rktlPrice, setRKTLPrice] = useState('');
  const [marketCap, setMarketCap] = useState('');
  const [loading, setLoading] = useState(true);

  const web3 = useSelector(selectors.web3State);
  const isMobile = useMediaQuery({ maxWidth: '1024px' });
  const location = useLocation();

  const initialize = useCallback(async () => {
    if (!web3) {
      return;
    }
    setLoading(true);
    let nowRKTLPrice = 0;
    let result = await getRKTLPrice();
    if (result.success) {
      setRKTLPrice(result.rktlPrice);
    }
    result = await getMarketCap(nowRKTLPrice);
    if (result.success) {
      setMarketCap(result.marketCap);
    }
    setLoading(false);
  }, [web3]);

  useEffect(() => {
    let path_name = location.pathname.replace('/', '');
    if (!path_list.includes(path_name))
      path_name = '';
    setNavSelected(path_name);
    if (path_name === 'admin')
      setAdmin(true);
    else
      setAdmin(false);
  }, [location]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  
  return (
    <>
      <GlobalStyles />
      <div
        className={`my-navbar bg-[#1B1E2A] flex-col justify-center z-50 ${(isMobile && !props.isOpen) && 'hide-nav'} ${isMobile ? 'mobile my-border-color border-end border-2' : 'non-mobile'}`}
      >
        {isMobile && (
          <button
            onClick={() => props.setIsOpen(prevState => !prevState)}
            className='btn-sidebar focus:outline-none hover:bg-gray-700'
          >
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        )}
        <div className="navbar-content">
          <div className='logo-img flex flex-col space-y-2 items-center pb-0' style={{ padding: '15px 30px' }}>
            <a href="https://rocketlaunch.finance/">
              <div style={{width: '150px'}}>
                <LogoAnim />
              </div>
              {/* <img alt='' src={'/img/logo.gif'} className='w-36' style={{ cursor: 'pointer' }} /> */}
            </a>
            {/* <p className='fs-20 text-white'>Rocket Launch</p> */}
            <img alt='' src={'/img/logo.svg'} className='w-48' style={{ cursor: 'pointer' }} />
            {/* <span className='fs-24 f-century text-green m-0'>{loading || rktlPrice === '' ? <LoadingSkeleton /> : `$${numberWithCommas(rktlPrice)}`}</span>
            <p className='fs-14 m-0' style={{ color: '#919BB5' }}>CURRENT $RKTL PRICE</p>
            <p className='fs-20 text-white'>{loading || marketCap === '' ? <LoadingSkeleton /> : '$' + numberWithCommas(marketCap)}</p>
            <p className='fs-14 m-0' style={{ color: '#919BB5' }}>MARKET CAP</p> */}
          </div>

          <nav>
            <hr className="menu-item" />
            {!isAdmin ? (
              <>
                <Link
                  to='/home'
                  className={`menu-item ${navSelected === 'home'
                    ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                    : 'block py-2 px-4 transition duration-200  hover:text-white'
                    }`}
                >
                  <div className='flex space-x-6 align-items-center'>
                    <i className="fa-solid fa-house-chimney fs-20"></i>
                    <div className='menu-text text-lg'>Home</div>
                  </div>
                </Link>
                <Link
                  to='/'
                  className={`menu-item ${navSelected === ''
                    ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                    : 'block py-2 px-4 transition duration-200  hover:text-white'
                    }`}
                >
                  <div className='flex space-x-6 align-items-center'>
                    <i className="fa-light fa-rocket fs-20"></i>
                    <div className='menu-text text-lg'>Presale</div>
                  </div>
                  {/* <div className="new-chip">New</div> */}
                </Link>
                <Link
                  to='/dashboard'
                  className={`menu-item ${navSelected === 'dashboard'
                    ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                    : 'block py-2 px-4 transition duration-200  hover:text-white'
                    }`}
                >
                  <div className='flex space-x-6 align-items-center'>
                    <i className="fa-solid fa-grid-2 fs-20"></i>
                    <div className='menu-text text-lg'>Dashboard</div>
                  </div>
                </Link>
                <Link
                  to='/account'
                  className={`menu-item ${navSelected === 'account'
                    ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                    : 'block py-2 px-4 transition duration-200  hover:text-white'
                    }`}
                >
                  <div className='flex space-x-6 align-items-center'>
                    <i className="fa-solid fa-chart-pie-simple fs-20"></i>
                    <div className='menu-text text-lg'>Account</div>
                  </div>
                </Link>
                <Link
                  to='/swap'
                  className={`menu-item ${navSelected === 'swap'
                    ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                    : 'block py-2 px-4 transition duration-200  hover:text-white'
                    }`}
                >
                  <div className='flex space-x-6 align-items-center'>
                    <i className="fa-solid fa-shuffle fs-20"></i>
                    <div className='menu-text text-lg'>Buy / Swap</div>
                  </div>
                </Link>
                {/* <Link
                  to='/nft_savings'
                  className={`menu-item ${navSelected === 'nft_savings'
                    ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                    : 'block py-2 px-4 transition duration-200  hover:text-white'
                    }`}
                >
                  <div className='flex space-x-6 align-items-center'>
                    <i className="fa-solid fa-hexagon-vertical-nft fs-20"></i>
                    <div className='menu-text text-lg'>NFT marketplace</div>
                  </div>
                </Link> */}
                {/* <Link
                  to='/rktl-bank'
                  className={`menu-item ${navSelected === 'rktl-bank'
                    ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                    : 'block py-2 px-4 transition duration-200  hover:text-white'
                    }`}
                >
                  <div className='flex space-x-6 align-items-center'>
                    <img src="/img/bank.png" alt='' />
                    <div className='text-lg'>RKTL Bank</div>
                  </div>
                </Link>
                <Link
                  to='/resurrection'
                  className={`menu-item ${navSelected === 'resurrection'
                    ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                    : 'block py-2 px-4 transition duration-200  hover:text-white'
                    }`}
                >
                  <div className='flex space-x-6 align-items-center'>
                    <img src="/img/nft.png" alt='' width="22px" />
                    <div className='text-lg'>RocketLaunchs Resurrection</div>
                  </div>
                </Link> */}
              </>
            ) : (
              <>
                {/********************** ADMIN ****************************/}
                <Link
                  to='/admin'
                  className={`menu-item ${navSelected === 'admin'
                    ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                    : 'block py-2 px-4 transition duration-200  hover:text-white'
                    }`}
                >
                  <div className='flex space-x-6'>
                    <i className="fa-solid fa-grid-2 fs-20"></i>
                    <div className='text-lg'>Administrator</div>
                  </div>
                </Link>
                {/********************** ADMIN ****************************/}
              </>
            )}
            {/* <hr className="menu-item" />
            <a
              // href={`https://traderjoexyz.com/trade?inputCurrency=AVAX&outputCurrency=${config.RKTLAddress}`}
              href={`https://pancakeswap.finance/swap?inputCurrency=BNB&outputCurrency=${config.RKTLAddress}`}
              rel="noreferrer"
              target='_blank'
              className={`menu-item ${navSelected === 'chart'
                ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                : 'block py-2 px-4 transition duration-200  hover:text-white'
                }`}
            >
              <div className='flex space-x-6 align-items-center'>
                <i className="fa-solid fa-chart-line fs-20"></i>
                <div className='menu-text text-lg'>Dex Charts</div>
              </div>
            </a>
            <a
              href="https://rocket-launch.gitbook.io/rocketlaunch/"
              rel="noreferrer"
              target='_blank'
              className={`menu-item ${navSelected === 'docs'
                ? 'menu-active-item block py-2 px-4 transition duration-200  text-white'
                : 'block py-2 px-4 transition duration-200  hover:text-white'
                }`}
            >
              <div className='flex space-x-6 align-items-center'>
                <i className="fa-solid fa-gear fs-20"></i>
                <div className='menu-text text-lg'>Docs</div>
              </div>
            </a> */}
            <div className="flex flex-column">
              <div className="sidebar-social-icons social-icons flex justify-content-center">
                <a href="https://twitter.com/RocketLaunchFin" target="_blank" rel="noreferrer"><i className="fa-brands fa-twitter"></i></a>
                <a href="https://medium.com/@rocketlaunchfinance" target="_blank" rel="noreferrer"><i className="fa-brands fa-medium"></i></a>
                <a href="https://discord.gg/dUe9QDKCWj" target="_blank" rel="noreferrer"><i className="fa-brands fa-discord"></i></a>
              </div>
            </div>
          </nav>
        </div>
        <div className='align-self-center text-white' align="center">
          <p>Copyright © 2022<br />Rocket Launch Finance, LLC</p>
          <p>All Rights Reserved.</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
