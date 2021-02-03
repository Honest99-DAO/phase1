import {JoiToken} from '../../types/ethers-contracts';
import {BigNumber, Signer} from 'ethers';


export function getTotalSupply(joiToken: JoiToken): Promise<BigNumber> {
  return joiToken.totalSupply()
}

export async function getMyBalance(joiTokenRO: JoiToken, signer: Signer): Promise<BigNumber> {
  const address = await signer.getAddress();

  return joiTokenRO.balanceOf(address);
}

export async function getMyBalanceAt(joiTokenRO: JoiToken, signer: Signer, timestamp: number): Promise<BigNumber> {
  const address = await signer.getAddress();

  return joiTokenRO.balanceAt(address, timestamp);
}

export async function getMaxTotalSupply(joiTokenRO: JoiToken): Promise<BigNumber> {
  return joiTokenRO.getMaxTotalSupply();
}

export async function getJoiPerEthMintPricePercent(joiTokenRO: JoiToken): Promise<BigNumber> {
  return joiTokenRO.getJoiPerEthMintPricePercent();
}

export async function mint(joiTokenRO: JoiToken, signer: Signer, amount: BigNumber) {
  const joiTokenRW = joiTokenRO.connect(signer);
  const address = await signer.getAddress();

  const tx = await joiTokenRW.mint(address, {value: amount});
  await tx.wait();
}