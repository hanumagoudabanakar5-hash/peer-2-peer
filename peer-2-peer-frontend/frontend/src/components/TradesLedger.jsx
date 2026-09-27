function short(addr) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function statusOf(t) {
  if (t.settled) return { label: "settled", cls: "pill--settled" };
  return { label: "escrowed", cls: "pill--escrow" };
}

export default function TradesLedger({ trades, isOracle, onConfirm, confirmingId }) {
  return (
    <section className="panel">
      <div className="panel__head">
        <h2>Escrow ledger</h2>
        <span className="panel__count mono">{trades.length} trades</span>
      </div>

      <ul className="ledger">
        {trades.map((t) => {
          const status = statusOf(t);
          return (
            <li className="ledger__row" key={t.id}>
              <span className="mono ledger__id">#{t.id}</span>
              <span className="ledger__flow">
                <span className="mono">{short(t.buyer)}</span> → <span className="mono">{short(t.seller)}</span>
              </span>
              <span className="ledger__kwh">{t.kwh} kWh</span>
              <span className="mono ledger__price">{t.amountPaidEth} ETH</span>
              <span className={`pill ${status.cls}`}>{status.label}</span>
              {isOracle && !t.settled && (
                <button
                  className="btn btn--sm btn--confirm"
                  disabled={confirmingId === t.id}
                  onClick={() => onConfirm(t)}
                >
                  {confirmingId === t.id ? "Confirming…" : "Confirm delivery"}
                </button>
              )}
            </li>
          );
        })}
        {trades.length === 0 && <li className="ledger__empty">No trades yet — buy a listing above to start one.</li>}
      </ul>
    </section>
  );
}
