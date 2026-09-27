function short(addr) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Listings({ listings, account, isRegistered, onList, onBuy, listing, buyingId }) {
  const active = listings.filter((l) => l.active);

  return (
    <section className="panel">
      <div className="panel__head">
        <h2>Marketplace</h2>
        <span className="panel__count mono">{active.length} active</span>
      </div>

      <ul className="ledger">
        {listings.map((l) => (
          <li className={`ledger__row ${l.active ? "" : "ledger__row--closed"}`} key={l.id}>
            <span className="mono ledger__id">#{l.id}</span>
            <span className="mono ledger__addr">{short(l.seller)}</span>
            <span className="ledger__kwh">{l.kwh} kWh</span>
            <span className="mono ledger__price">{l.pricePerKwhEth} ETH/kWh</span>
            {l.active ? (
              account &&
              isRegistered &&
              l.seller.toLowerCase() !== account.toLowerCase() && (
                <button
                  className="btn btn--sm btn--sell"
                  disabled={buyingId === l.id}
                  onClick={() => onBuy(l)}
                >
                  {buyingId === l.id ? "Buying…" : "Buy"}
                </button>
              )
            ) : (
              <span className="pill pill--closed">reserved</span>
            )}
          </li>
        ))}
        {listings.length === 0 && <li className="ledger__empty">No listings yet — surplus households can list below.</li>}
      </ul>

      {account && isRegistered && <ListForm onList={onList} listing={listing} />}
    </section>
  );
}

function ListForm({ onList, listing }) {
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault();
        const kwh = Number(e.target.elements.kwh.value);
        const price = e.target.elements.price.value;
        if (kwh > 0 && price) onList(kwh, price);
      }}
    >
      <input name="kwh" type="number" min="1" step="1" placeholder="kWh surplus" required />
      <input name="price" type="text" placeholder="Price/kWh (ETH, e.g. 0.0001)" required />
      <button className="btn btn--primary" type="submit" disabled={listing}>
        {listing ? "Listing…" : "List surplus"}
      </button>
    </form>
  );
}
