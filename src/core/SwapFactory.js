import { config } from "./config";
import { getUTCNow, parseErrorMsg } from '../components/utils';
import store from "../store";
const RKTLABI = config.RKTLAbi;
const RKTLAddress = config.RKTLAddress;
const AvaxAddress = config.AvaxAddress;
const USDCABI = config.USDCAbi;
const USDCAddress = config.USDCAddress;
const JOEABI = config.JoeRouterAbi;
const JOEAddress = config.JoeRouterAddress;
const AvaxRKTLPairAddress = config.avaxRKTLPair;
const AvaxRKTLPairABI = config.avaxRKTLAbi;
const MAX_APPROVE_AMOUNT = 2 ** 32 - 1;

export const getReservesForPair = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const PairContract = new web3.eth.Contract(AvaxRKTLPairABI, AvaxRKTLPairAddress);
    const result = await PairContract.methods.getReserves().call();
    const reserves = [];
    reserves.push(web3.utils.fromWei(result._reserve1)); // reserve[1] should be AVAX
    reserves.push(web3.utils.fromWei(result._reserve0)); // reserve[0] should be RKTL
    return {
      success: true,
      reserves // reserve 0: RKTL, 1: USDC
    }
  } catch (error) {
    console.log('[Reserve Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getAmountsOut = async (amountIn, coin_arrange, coin_type) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  if (amountIn <= 0) {
    return {
      success: false,
      result: "Something went wrong "
    }
  }

  try {
    let from_decimal = 'ether';
    let to_decimal = 'ether';
    const path = [];
    if (coin_arrange) {
      if (coin_type === 1) {
        path.push(USDCAddress);
        from_decimal = 'ether';
      }
      path.push(AvaxAddress);
      path.push(RKTLAddress);
    } else {
      path.push(RKTLAddress);
      path.push(AvaxAddress);
      if (coin_type === 1) {
        path.push(USDCAddress);
        to_decimal = 'ether';
      }
    }
    
    const JoeContract = new web3.eth.Contract(JOEABI, JOEAddress);
    let amountOut = await JoeContract.methods.getAmountsOut(web3.utils.toWei(amountIn.toString(), from_decimal), path).call();
    return {
      success: true,
      amountOut: web3.utils.fromWei(amountOut[amountOut.length - 1], to_decimal)
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}


export const getAmountsIn = async (amountOut, coin_arrange, coin_type) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  if (amountOut <= 0) {
    return {
      success: false,
      result: "Something went wrong "
    }
  }

  try {
    let from_decimal = 'ether';
    let to_decimal = 'ether';
    const path = [];
    if (coin_arrange) {
      if (coin_type === 1) {
        path.push(USDCAddress);
        to_decimal = 'ether';
      }
      path.push(AvaxAddress);
      path.push(RKTLAddress);
    } else {
      path.push(RKTLAddress);
      path.push(AvaxAddress);
      if (coin_type === 1) {
        path.push(USDCAddress);
        from_decimal = 'ether';
      }
    }
    const JoeContract = new web3.eth.Contract(JOEABI, JOEAddress);
    let amountIn = await JoeContract.methods.getAmountsIn(web3.utils.toWei(amountOut.toString(), from_decimal), path).call();
    return {
      success: true,
      amountIn: web3.utils.fromWei(amountIn[0], to_decimal)
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getRKTLAllowance = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const RKTLContract = new web3.eth.Contract(RKTLABI, RKTLAddress);
    let ret_allowance = await RKTLContract.methods.allowance(accounts[0], JOEAddress).call();
    if (web3.utils.fromWei(ret_allowance) >= MAX_APPROVE_AMOUNT) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log('[RKTL Allowance] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getUSDCAllowance = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const UsdcContract = new web3.eth.Contract(USDCABI, USDCAddress);
    let ret_allowance = await UsdcContract.methods.allowance(accounts[0], JOEAddress).call();
    if (web3.utils.fromWei(ret_allowance) >= MAX_APPROVE_AMOUNT) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log('[USDC Allowance] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const approveRKTL = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const maxAmount = web3.utils.toWei(MAX_APPROVE_AMOUNT.toString());
    const RKTLContract = new web3.eth.Contract(RKTLABI, RKTLAddress);
    await RKTLContract.methods.approve(JOEAddress, maxAmount).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    console.log('[Approve RKTL] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const approveUSDC = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const maxAmount = web3.utils.toWei(MAX_APPROVE_AMOUNT.toString());
    const UsdcContract = await new web3.eth.Contract(USDCABI, USDCAddress);
    await UsdcContract.methods.approve(JOEAddress, maxAmount).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    console.log('[Approve USDC] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const swap = async (amountInRaw, amountOutRaw, exactToken, amountMinMax, coin_arrange, coin_type) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  if (amountInRaw <= 0) {
    return {
      success: false,
      result: "Something went wrong "
    }
  }

  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const JoeContract = new web3.eth.Contract(JOEABI, JOEAddress);

    let decimal = 'ether';
    const path = [];
    if (coin_arrange) {
      if (coin_type === 0) {
        path.push(AvaxAddress);
      } else {
        decimal = 'ether';
      }
      path.push(USDCAddress);
      path.push(RKTLAddress);
    } else {
      path.push(RKTLAddress);
      path.push(USDCAddress);
      if (coin_type === 0) {
        path.push(AvaxAddress);
      } else {
        if (exactToken)
          decimal = 'ether';
        else
          decimal = 'ether';
      }
    }

    let amountIn = 0, amountInMax = 0, amountOut = 0;
    if (exactToken) {
      amountIn = web3.utils.toWei(amountInRaw.toString(), decimal);
    } else {
      amountOut = web3.utils.toWei(amountOutRaw.toString(), decimal);
      // const nDecimal = decimal === 'ether' ? 18 : 6;
      amountInMax = MAX_APPROVE_AMOUNT.toString(); //Math.floor(amountMinMax * 10 ** decimal).toString();
    }
    const deadline = Math.floor((getUTCNow() / 1000)) + 60 * 300;
    if (coin_arrange) {
      if (coin_type === 0) {
        if (exactToken) {
          console.log('swapExactAVAXForTokens');
          const swap = JoeContract.methods.swapExactETHForTokens(0, path, accounts[0], deadline);
          try {
            await swap.estimateGas({ from: accounts[0], value: amountIn });
            await JoeContract.methods.swapExactETHForTokens(0, path, accounts[0], deadline).send({ from: accounts[0], value: amountIn });
          } catch (error) {
            return {
              success: false,
              error: parseErrorMsg(error.message)
            }
          }
        } else {
          console.log('swapAVAXForExactTokens');
          const swap = JoeContract.methods.swapETHForExactTokens(amountOut, path, accounts[0], deadline);
          try {
            await swap.estimateGas({ from: accounts[0], value: amountInMax });
            await JoeContract.methods.swapETHForExactTokens(amountOut, path, accounts[0], deadline).send({ from: accounts[0], value: amountInMax });
          } catch (error) {
            return {
              success: false,
              error: parseErrorMsg(error.message)
            }
          }
        }
      } else {
        if (exactToken) {
          console.log('swapExactTokensForTokens');
          const swap = JoeContract.methods.swapExactTokensForTokens(amountIn, 0, path, accounts[0], deadline);
          try {
            await swap.estimateGas({ from: accounts[0] });
            await JoeContract.methods.swapExactTokensForTokens(amountIn, 0, path, accounts[0], deadline).send({ from: accounts[0] });
          } catch (error) {
            return {
              success: false,
              error: parseErrorMsg(error.message)
            }
          }
        } else {
          console.log('swapTokensForExactTokens');
          const swap = JoeContract.methods.swapTokensForExactTokens(amountOut, amountInMax, path, accounts[0], deadline);
          try {
            await swap.estimateGas({ from: accounts[0] });
            await JoeContract.methods.swapTokensForExactTokens(amountOut, amountInMax, path, accounts[0], deadline).send({ from: accounts[0] });
          } catch (error) {
            return {
              success: false,
              error: parseErrorMsg(error.message)
            }
          }
        }
      }
    } else {
      if (coin_type === 0) {
        if (exactToken) {
          console.log('swapExactTokensForAVAX');
          const swap = JoeContract.methods.swapExactTokensForETH(amountIn, 0, path, accounts[0], deadline);
          try {
            await swap.estimateGas({ from: accounts[0] });
            await JoeContract.methods.swapExactTokensForETH(amountIn, 0, path, accounts[0], deadline).send({ from: accounts[0] });
          } catch (error) {
            return {
              success: false,
              error: parseErrorMsg(error.message)
            }
          }
        } else {
          console.log('swapTokensForExactAVAX');
          const swap = JoeContract.methods.swapTokensForExactETH(amountOut, amountInMax, path, accounts[0], deadline);
          try {
            await swap.estimateGas({ from: accounts[0] });
            await JoeContract.methods.swapTokensForExactETH(amountOut, amountInMax, path, accounts[0], deadline).send({ from: accounts[0] });
          } catch (error) {
            return {
              success: false,
              error: parseErrorMsg(error.message)
            }
          }
        }
      } else {
        if (exactToken) {
          console.log('swapExactTokensForTokens');
          const swap = JoeContract.methods.swapExactTokensForTokens(amountIn, 0, path, accounts[0], deadline);
          try {
            await swap.estimateGas({ from: accounts[0] });
            await JoeContract.methods.swapExactTokensForTokens(amountIn, 0, path, accounts[0], deadline).send({ from: accounts[0] });
          } catch (error) {
            return {
              success: false,
              error: parseErrorMsg(error.message)
            }
          }
        } else {
          console.log('swapTokensForExactTokens');
          const swap = JoeContract.methods.swapTokensForExactTokens(amountOut, amountInMax, path, accounts[0], deadline);
          try {
            await swap.estimateGas({ from: accounts[0] });
            await JoeContract.methods.swapTokensForExactTokens(amountOut, amountInMax, path, accounts[0], deadline).send({ from: accounts[0] });
          } catch (error) {
            return {
              success: false,
              error: parseErrorMsg(error.message)
            }
          }
        }
      }
    }
    return {
      success: true,
    }
  } catch (error) {
    console.log('[Swap] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}