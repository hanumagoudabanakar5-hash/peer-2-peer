# Peer-2-Peer Dashboard

React + ethers.js dashboard for the microgrid: today's forecast, live
households, the listing marketplace, and the escrow trade ledger — all
read directly from your deployed `EnergyTrading` contract.

## Setup

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Wiring it to your chain

1. **Contract address.** After each `npm run deploy` in `contracts/`,
   the address is written to `ai/contract_address.txt`. Either:
   - paste it into `src/contractConfig.js` (`CONTRACT_ADDRESS`), or
   - create `frontend/.env` with `VITE_CONTRACT_ADDRESS=0x...`

2. **Local Hardhat node.** Run your usual local chain
   (`npx hardhat node` in `contracts/`, then `npm run deploy`), then
   just `npm run dev` — the dashboard reads from `http://127.0.0.1:8545`
   by default, same as your `integrate.py` / `run_market.py` scripts.
   To interact (register, list, buy, confirm) rather than just view,
   connect MetaMask and import one of Hardhat's default test accounts
   (the ones in `run_market.py`).

3. **Polygon Amoy (for the public testnet link).** Once deployed there:
   - set `VITE_NETWORK=polygonAmoy` and `VITE_CONTRACT_ADDRESS=<amoy address>` in `.env`
   - `npm run build` — outputs static files in `dist/`, deployable to
     Vercel/Netlify/GitHub Pages for the public link the roadmap calls for

## Forecast panel

The hero strip reads `public/forecast.json`. Generate it from real
weather:

```bash
cd ai
source venv/bin/activate
python export_forecast.py
cp forecast.json ../frontend/public/forecast.json
```

Re-run this each time you want the dashboard to reflect today's
weather; a sample file is included so the panel isn't empty before you
do.

## Notes

- Households are discovered from `Registered` event logs (the mapping
  itself isn't enumerable) — this works well for a local chain or fresh
  testnet deployment. On a long-lived deployment with many blocks, you'd
  want to cap the event query range.
- The "Confirm delivery" button only appears for the connected account
  that matches `oracle()` on the contract (the deployer, per your
  constructor).
- All chain state polls every 6s and also refreshes right after your
  own transactions confirm.
