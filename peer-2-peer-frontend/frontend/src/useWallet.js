import { useState, useEffect, useCallback, useMemo } from "react";
import { BrowserProvider, JsonRpcProvider, Contract } from "ethers";
import { ENERGY_TRADING_ABI, CONTRACT_ADDRESS, NETWORKS, ACTIVE_NETWORK } from "./contractConfig";

const network = NETWORKS[ACTIVE_NETWORK];

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);

  // Read-only provider so the dashboard shows live chain state even
  // before anyone connects a wallet.
  const readProvider = useMemo(() => new JsonRpcProvider(network.rpcUrls[0]), []);
  const readContract = useMemo(
    () => new Contract(CONTRACT_ADDRESS, ENERGY_TRADING_ABI, readProvider),
    [readProvider]
  );

  const [writeContract, setWriteContract] = useState(null);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("No wallet found. Install MetaMask to register, list, buy, or confirm delivery.");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const net = await provider.getNetwork();
      setAccount(addr);
      setChainId(Number(net.chainId));
      setWriteContract(new Contract(CONTRACT_ADDRESS, ENERGY_TRADING_ABI, signer));
    } catch (e) {
      setError(e?.shortMessage || e?.message || "Wallet connection failed.");
    }
  }, []);

  const switchToTargetNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainIdHex }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: network.chainIdHex,
              chainName: network.chainName,
              rpcUrls: network.rpcUrls,
              nativeCurrency: network.nativeCurrency,
              blockExplorerUrls: network.blockExplorerUrls,
            },
          ],
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accs) => setAccount(accs[0] || null);
    const handleChain = (cid) => setChainId(parseInt(cid, 16));
    window.ethereum.on?.("accountsChanged", handleAccounts);
    window.ethereum.on?.("chainChanged", handleChain);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", handleAccounts);
      window.ethereum.removeListener?.("chainChanged", handleChain);
    };
  }, []);

  return {
    account,
    chainId,
    error,
    connect,
    switchToTargetNetwork,
    readContract,
    writeContract,
    targetChainIdHex: network.chainIdHex,
    targetLabel: network.label,
  };
}
