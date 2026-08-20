# Peer-2-Peer — AI-Forecasted Blockchain Energy Trading

A decentralized platform that lets neighbouring households on a local microgrid trade surplus rooftop-solar power directly with each other. An **AI forecaster** predicts who will have surplus energy to sell, and a **blockchain settlement layer** lets strangers trade that energy trustlessly, with no middleman.

Built for **Schneider Electric Yuva Yodha 2026** — Grid Reliability & Renewable Intermittency track.

---

## The Problem

India is adding rooftop solar rapidly, but solar is intermittent: a house generates surplus power at midday and runs a deficit at night. Today that surplus is wasted or sold back to the grid at poor fixed rates — while a neighbour is buying expensive grid power at that same moment. There is no easy, trustworthy way for neighbours to trade energy directly, and no way to know in advance who will have surplus to sell.

## The Solution

Two engines working together:

- **AI forecaster** — predicts each household's next-day solar generation and consumption from real weather data, identifying surplus (sellers) and deficit (buyers) *in advance*. This is how the system plans around solar intermittency instead of reacting to it.
- **Blockchain settlement** — smart contracts hold buyer payment in escrow and release it to the seller only once energy delivery is confirmed. Neither party has to trust the other; they trust auditable code.

Neither half alone is the product. The AI creates the value (knowing who can sell); the blockchain enables the exchange (trustless settlement between strangers). Together they form a working local energy market.

---

## Architecture

```
Real weather  ──►  AI Forecaster  ──►  Virtual Smart Meter  ──►  Oracle  ──►  Smart Contract  ──►  Settlement
(Open-Meteo)       (scikit-learn)      (per-house readings)      (Python)     (Solidity/EVM)       (escrow release)
```

| Layer | Role | Technology |
|-------|------|------------|
| Forecasting | Predicts household energy surplus from weather | Python, scikit-learn (Gradient Boosting) |
| Data source | Real historical + live weather for the microgrid location | Open-Meteo API (free, no key) |
| Virtual meter | Simulates per-household kWh generation & consumption | Python |
| Oracle | Brings real-world delivery confirmation on-chain | Python (calls the contract) |
| Settlement | Registration, listing, escrow trading, oracle-gated payout | Solidity, Hardhat |

---

## The Smart Contract — `EnergyTrading.sol`

The core of the trustless-settlement layer. Key functions:

- `register(name)` — a household joins the microgrid.
- `listSurplus(kwh, pricePerKwh)` — a registered seller lists surplus energy.
- `buyEnergy(listingId)` *(payable)* — a buyer pays **into the contract's escrow**, not directly to the seller.
- `confirmDelivery(tradeId)` — **oracle-only**; confirms real-world delivery and releases escrow to the seller.

**Design highlights**
- Payment is held in escrow by the contract and released only on confirmed delivery — this is the trustless-settlement guarantee.
- `confirmDelivery` is access-controlled to the oracle address, so no buyer can fraudulently release their own escrow.
- State is set before value transfer (reentrancy-conscious), and payouts use the recommended `.call{value:}` pattern with a success check.

**Tested** — full Hardhat suite covering registration, double-registration guard, listing, the complete escrow cycle (money held, then released only after delivery), and the access-control check that a non-oracle cannot release funds.

---

## What's Real vs. Simulated

Stated honestly, because the architecture is designed to swap simulation for production hardware with no code change:

| Component | Prototype | Production |
|-----------|-----------|------------|
| Weather data | **Real** (Open-Meteo, live + historical) | Same |
| Forecasting model | **Real** (trained on real weather) | Same |
| Smart contracts | **Real** (deployed, tested) | Same, on mainnet/L2 |
| Meter readings | Simulated (virtual smart meter) | Physical smart meters via IoT gateway |
| Oracle | Centralized (trusted address) | Decentralized oracle network (e.g. Chainlink) |

The system is **meter-ready**: only the data source and oracle change from prototype to production.

---

## Tech Stack

- **AI / Forecasting:** Python, scikit-learn, pandas, NumPy
- **Weather:** Open-Meteo API
- **Blockchain:** Solidity `^0.8.28`, Hardhat 3
- **Testing:** Mocha + ethers + chai
- **Frontend (in progress):** React + ethers.js

---

## Project Structure

```
peer-2-peer/
├── ai/                       # forecasting + microgrid simulation
│   ├── build_dataset.py      # pulls real weather, builds training data
│   ├── train_forecaster.py   # trains the surplus forecaster
│   ├── predict_today.py      # predicts today's surplus from live weather
│   └── microgrid.py          # splits a 5-house microgrid into buyers/sellers
└── contracts/                # Hardhat project
    ├── contracts/EnergyTrading.sol
    ├── test/EnergyTrading.ts
    └── scripts/deploy.ts
```

---

## Running It

**AI side**
```bash
cd ai
source venv/bin/activate
python train_forecaster.py     # train the model
python microgrid.py            # see today's buyers and sellers
```

**Blockchain side**
```bash
cd contracts
npm install
npm run test                   # run the full test suite
npm run deploy                 # deploy to a local chain
```

---

## Roadmap

- [x] AI forecaster trained on real weather
- [x] Live microgrid buyer/seller split from today's weather
- [x] EnergyTrading smart contract with escrow + oracle settlement
- [x] Full passing test suite
- [x] Local deployment
- [ ] Python oracle wired to the deployed contract (integration)
- [ ] React dashboard — live microgrid, trades, forecast
- [ ] Deployment to Polygon Amoy testnet
- [ ] Demo video + submission

---

## Author

Third-year B.Tech CSE (Blockchain) student — solo entry, Yuva Yodha 2026.
