import { BrowserProvider, ethers } from 'ethers';
import { Web3State } from '../types';

class Web3Service {
  private provider: BrowserProvider | null = null;

  public isEthereumAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  }

  public async connectWallet(): Promise<Web3State> {
    if (!this.isEthereumAvailable()) {
      throw new Error('No crypto wallet found. Please install MetaMask.');
    }

    try {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      
      // Request account access
      await this.provider.send('eth_requestAccounts', []);
      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(address);

      return {
        isConnected: true,
        address,
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance),
      };
    } catch (err: any) {
      console.error(err);
      throw new Error('Failed to connect wallet');
    }
  }

  public async signTrade(tradePayload: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }
    const signer = await this.provider.getSigner();
    
    // Sign a message to cryptographically verify trade execution intent
    const signature = await signer.signMessage(`Verify Trade Execution: ${tradePayload}`);
    return signature;
  }
}

export const web3Service = new Web3Service();
