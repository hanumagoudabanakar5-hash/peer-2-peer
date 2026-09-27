function short(addr) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Households({ households, oracle, account, onRegister, registering }) {
  const alreadyRegistered = households.some((h) => h.address?.toLowerCase() === account?.toLowerCase());

  return (
    <section className="panel">
      <div className="panel__head">
        <h2>Households</h2>
        <span className="panel__count mono">{households.length} on the grid</span>
      </div>

      <ul className="ledger">
        {households.map((h) => (
          <li className="ledger__row" key={h.address}>
            <span className="ledger__name">{h.name}</span>
            <span className="mono ledger__addr">{short(h.address)}</span>
            {h.address?.toLowerCase() === oracle?.toLowerCase() && (
              <span className="pill pill--oracle">oracle</span>
            )}
          </li>
        ))}
        {households.length === 0 && <li className="ledger__empty">No households registered yet.</li>}
      </ul>

      {account && !alreadyRegistered && (
        <RegisterRow onRegister={onRegister} registering={registering} />
      )}
    </section>
  );
}

function RegisterRow({ onRegister, registering }) {
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault();
        const name = e.target.elements.name.value.trim();
        if (name) onRegister(name);
      }}
    >
      <input name="name" placeholder="Household name (e.g. House_D)" required />
      <button className="btn btn--primary" type="submit" disabled={registering}>
        {registering ? "Registering…" : "Join grid"}
      </button>
    </form>
  );
}
