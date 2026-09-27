function short(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function WalletBar({ wallet, isOracle }) {
  const { account, chainId, error, connect, switchToTargetNetwork, targetChainIdHex, targetLabel } = wallet;
  const onTargetNetwork = chainId != null && `0x${chainId.toString(16)}` === targetChainIdHex;

  return (
    <header className="walletbar">
      <div className="walletbar__brand">
        <span className="walletbar__mark">⚡</span>
        <span className="walletbar__name">Peer-2-Peer</span>
        <span className="walletbar__tag">microgrid control room</span>
      </div>

      <div className="walletbar__status">
        {account && !onTargetNetwork && (
          <button className="btn btn--ghost" onClick={switchToTargetNetwork}>
            Switch to {targetLabel}
          </button>
        )}
        {account && isOracle && <span className="pill pill--oracle">oracle account</span>}
        {account ? (
          <span className="walletbar__account">{short(account)}</span>
        ) : (
          <button className="btn btn--primary" onClick={connect}>
            Connect Wallet
          </button>
        )}
      </div>
      {error && <div className="walletbar__error">{error}</div>}
    </header>
  );
}
