import { useState, useCallback } from "react";
import { parseEther } from "ethers";
import { useWallet } from "./useWallet";
import { useMarketData } from "./useMarketData";
import WalletBar from "./components/WalletBar";
import ForecastStrip from "./components/ForecastStrip";
import Households from "./components/Households";
import Listings from "./components/Listings";
import TradesLedger from "./components/TradesLedger";

export default function App() {
  const wallet = useWallet();
  const { oracle, households, listings, trades, loading, lastUpdated, refresh } = useMarketData(
    wallet.readContract
  );

  const [toast, setToast] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [listingBusy, setListingBusy] = useState(false);
  const [buyingId, setBuyingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const notify = useCallback((msg, kind = "info") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const requireWallet = () => {
    if (!wallet.writeContract) {
      notify("Connect your wallet first.", "error");
      return false;
    }
    return true;
  };

  const handleRegister = async (name) => {
    if (!requireWallet()) return;
    setRegistering(true);
    try {
      const tx = await wallet.writeContract.register(name);
      await tx.wait();
      notify(`${name} registered on the grid.`, "success");
      refresh();
    } catch (e) {
      notify(e?.shortMessage || e?.reason || "Registration failed.", "error");
    } finally {
      setRegistering(false);
    }
  };

  const handleList = async (kwh, priceEth) => {
    if (!requireWallet()) return;
    setListingBusy(true);
    try {
      const price = parseEther(priceEth);
      const tx = await wallet.writeContract.listSurplus(kwh, price);
      await tx.wait();
      notify(`Listed ${kwh} kWh for sale.`, "success");
      refresh();
    } catch (e) {
      notify(e?.shortMessage || e?.reason || "Listing failed.", "error");
    } finally {
      setListingBusy(false);
    }
  };

  const handleBuy = async (l) => {
    if (!requireWallet()) return;
    setBuyingId(l.id);
    try {
      const cost = l.pricePerKwh * BigInt(l.kwh);
      const tx = await wallet.writeContract.buyEnergy(l.id, { value: cost });
      await tx.wait();
      notify(`Bought listing #${l.id}. Payment is held in escrow.`, "success");
      refresh();
    } catch (e) {
      notify(e?.shortMessage || e?.reason || "Purchase failed.", "error");
    } finally {
      setBuyingId(null);
    }
  };

  const handleConfirm = async (t) => {
    if (!requireWallet()) return;
    setConfirmingId(t.id);
    try {
      const tx = await wallet.writeContract.confirmDelivery(t.id);
      await tx.wait();
      notify(`Delivery confirmed for trade #${t.id}. Escrow released.`, "success");
      refresh();
    } catch (e) {
      notify(e?.shortMessage || e?.reason || "Confirmation failed.", "error");
    } finally {
      setConfirmingId(null);
    }
  };

  const isOracle = wallet.account && oracle && wallet.account.toLowerCase() === oracle.toLowerCase();
  const isRegistered = households.some(
    (h) => h.address.toLowerCase() === wallet.account?.toLowerCase()
  );

  return (
    <div className="app">
      <WalletBar wallet={wallet} isOracle={isOracle} />
      <ForecastStrip />

      <main className="grid">
        <Households
          households={households}
          oracle={oracle}
          account={wallet.account}
          onRegister={handleRegister}
          registering={registering}
        />
        <Listings
          listings={listings}
          account={wallet.account}
          isRegistered={isRegistered}
          onList={handleList}
          onBuy={handleBuy}
          listing={listingBusy}
          buyingId={buyingId}
        />
        <TradesLedger
          trades={trades}
          isOracle={isOracle}
          onConfirm={handleConfirm}
          confirmingId={confirmingId}
        />
      </main>

      <footer className="footer">
        <span>weather → AI forecast → on-chain listing → escrow trade → oracle settlement</span>
        <span className="mono">
          {loading ? "syncing…" : lastUpdated ? `synced ${lastUpdated.toLocaleTimeString()}` : ""}
        </span>
      </footer>

      {toast && <div className={`toast toast--${toast.kind}`}>{toast.msg}</div>}
    </div>
  );
}
