import React, { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { createGlobalStyle } from 'styled-components';
import { getUTCNow, LoadingSkeleton } from '../../components/utils';

const GlobalStyles = createGlobalStyle`
  .progress-content {
    width: 100%;
    border-radius: 50%;
    padding: 10px;
    margin: auto;
    position: relative;
  }

  .rebase-content {
    position: absolute;
    width: 100%;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    text-align: center;
    .rebase-title {
      font-size: 16px;
      @media only screen and (max-width: 1500px) and (min-width: 1200px) {
        font-size: 12px;
      }
    }
    .rebase-time {
      font-size: 24px;
      @media only screen and (max-width: 1500px) and (min-width: 1200px) {
        font-size: 20px;
      }
    }
  }
`;

function CapBackGradientSVG() {
  const gradientTransform = `rotate(0)`;
  return (
    <svg style={{ height: 0 }}>
      <defs>
        <linearGradient id={"capBack"} gradientTransform={gradientTransform}>
          <stop offset="0%" stopColor="rgb(47, 40, 85, 0.5)" />
          <stop offset="100%" stopColor="rgb(47, 40, 85, 0.5)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CapGradientSVG() {
  const gradientTransform = `rotate(20)`;
  return (
    <svg style={{ height: 0 }}>
      <defs>
        <linearGradient id={"cap"} gradientTransform={gradientTransform}>
          <stop offset="0%" stopColor="rgb(255, 184, 77)" />
          <stop offset="100%" stopColor="rgb(255, 184, 77)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const RebaseBar = ({ nextRebase, interval }) => {
  const [minutes, setMin] = useState(0);
  const [seconds, setSec] = useState(0);
  const [percent, setPercent] = useState(100);
  const [counter, setCounter] = useState(0);
  const [timerId, setTimerId] = useState(0);
  
  const leading0 = (num) => {
    return num < 10 ? "0" + num : num;
  }
  const getTimeUntil = (deadline, interval) => {
    const time = deadline - getUTCNow();
    if (time < 0) {
      setMin(0);
      setSec(0);
    } else {
      const sec = Math.floor((time / 1000) % 60);
      const min = Math.floor((time / 1000 / 60));
      let perc = 0;
      if (time > interval * 1000) {
        perc = 100;
      } else {
        perc = (time / 1000 * 100) / interval;
      }
      setMin(min);
      setSec(sec);
      setPercent(perc);
    }
  }

  useEffect(() => {
    return () => {
      clearInterval(timerId);
    }
  }, [timerId])

  useEffect(() => {
    if (nextRebase > 0 && interval > 0 && counter === 0) {
      const timerId = setInterval(() => getTimeUntil(nextRebase, interval), 1000);
      setCounter(prevState => prevState + 1);
      setTimerId(timerId);
    }
  }, [nextRebase, interval, counter]);

  return (
    <>
      <GlobalStyles />
      <div className='progress-content'>
        <CapBackGradientSVG />
        <CapGradientSVG />
        <CircularProgressbar
          value={percent}
          counterClockwise={true}
          strokeWidth={10}
          styles={buildStyles({
            pathColor: `url(#cap)`,
            textColor: 'white',
            textSize: 16,
            strokeLinecap: "butt",
            trailColor: `url(#capBack)`
          })}
        />
        <div className="rebase-content">
          <p className="text-center f-century rebase-title">TIME UNTIL<br />NEXT REBASE</p>
          <p className="text-center fw-bold rebase-time">{nextRebase > 0 ? leading0(minutes % 30) + ':' + leading0(seconds) : <LoadingSkeleton width={50}/>}</p>
        </div>
      </div>
    </>
  );
}
export default RebaseBar;
