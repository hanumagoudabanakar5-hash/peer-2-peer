import { useState, useEffect, useCallback, useRef } from "react";
import { formatEther } from "ethers";

const POLL_MS = 6000;

export function useMarketData(readContract) {
  const [oracle, setOracle] = useState(null);
  const [households, setHouseholds] = useState([]); // [{address, name}]
  const [listings, setListings] = useState([]); // [{id, seller, kwh, pricePerKwh, active}]
  const [trades, setTrades] = useState([]); // [{id, ...}]
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const knownAddresses = useRef(new Set());

  const refresh = useCallback(async () => {
    try {
      const oracleAddr = await readContract.oracle();
      setOracle(oracleAddr);

      // Households aren't enumerable on-chain, so discover addresses from
      // Registered events (cheap on a fresh local/testnet chain), then read
      // current state for each.
      const regEvents = await readContract.queryFilter(readContract.filters.Registered());
      regEvents.forEach((e) => knownAddresses.current.add(e.args.who));
      const householdRows = await Promise.all(
        [...knownAddresses.current].map(async (addr) => {
          const h = await readContract.households(addr);
          return { address: addr, registered: h[0], name: h[1] };
        })
      );
      setHouseholds(householdRows.filter((h) => h.registered));

      const listingCount = Number(await readContract.listingCount());
      const listingRows = await Promise.all(
        Array.from({ length: listingCount }, (_, i) => i).map(async (i) => {
          const l = await readContract.listings(i);
          return {
            id: i,
            seller: l[0],
            kwh: Number(l[1]),
            pricePerKwh: l[2],
            pricePerKwhEth: formatEther(l[2]),
            active: l[3],
          };
        })
      );
      setListings(listingRows);

      const tradeCount = Number(await readContract.tradeCount());
      const tradeRows = await Promise.all(
        Array.from({ length: tradeCount }, (_, i) => i).map(async (i) => {
          const t = await readContract.trades(i);
          return {
            id: i,
            listingId: Number(t[0]),
            buyer: t[1],
            seller: t[2],
            kwh: Number(t[3]),
            amountPaid: t[4],
            amountPaidEth: formatEther(t[4]),
            delivered: t[5],
            settled: t[6],
          };
        })
      );
      setTrades(tradeRows.reverse()); // newest first

      setLastUpdated(new Date());
    } catch (e) {
      // Swallow — most likely the node isn't running yet; the UI shows a
      // connection hint separately.
      console.warn("market data refresh failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, [readContract]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { oracle, households, listings, trades, loading, lastUpdated, refresh };
}
