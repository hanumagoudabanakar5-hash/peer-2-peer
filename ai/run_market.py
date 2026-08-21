import json
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
assert w3.is_connected(), "Not connected — is the node running?"

with open("contract_address.txt") as f:
    CONTRACT_ADDRESS = Web3.to_checksum_address(f.read().strip())
assert w3.eth.get_code(CONTRACT_ADDRESS) != b"", "No contract at address — redeploy!"

with open("../contracts/artifacts/contracts/EnergyTrading.sol/EnergyTrading.json") as f:
    abi = json.load(f)["abi"]
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)
print(f"Using contract at {CONTRACT_ADDRESS}\n")

ORACLE = {"addr": Web3.to_checksum_address("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
          "key": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"}
HOUSE_A = {"addr": Web3.to_checksum_address("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"),
           "key": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"}
HOUSE_B = {"addr": Web3.to_checksum_address("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"),
           "key": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"}
HOUSE_C = {"addr": Web3.to_checksum_address("0x90F79bf6EB2c4f870365E785982E1f101E93b906"),
           "key": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"}

def send(fn, account, value=0):
    tx = fn.build_transaction({"from": account["addr"],
        "nonce": w3.eth.get_transaction_count(account["addr"]), "value": value})
    signed = w3.eth.account.sign_transaction(tx, account["key"])
    h = w3.eth.send_raw_transaction(signed.raw_transaction)
    return w3.eth.wait_for_transaction_receipt(h)

def eth(wei): return w3.from_wei(wei, "ether")

print("STEP 1: Registering households on-chain")
for acct, name in [(HOUSE_A, "House_A"), (HOUSE_B, "House_B"), (HOUSE_C, "House_C")]:
    if not contract.functions.households(acct["addr"]).call()[0]:
        send(contract.functions.register(name), acct)
    print(f"  {name} registered: {contract.functions.households(acct['addr']).call()[0]}")

print("\nSTEP 2: Sellers list surplus (from AI forecast)")
PRICE = w3.to_wei(0.0001, "ether")
send(contract.functions.listSurplus(13, PRICE), HOUSE_A)
print(f"  House_A listed 13 kWh @ {eth(PRICE)} ETH/kWh")
send(contract.functions.listSurplus(3, PRICE), HOUSE_B)
print(f"  House_B listed 3 kWh @ {eth(PRICE)} ETH/kWh")
print(f"  Total listings: {contract.functions.listingCount().call()}")

print("\nSTEP 3: House_C buys from House_A (payment into escrow)")
listing = contract.functions.listings(0).call()
kwh, price_per = listing[1], listing[2]
cost = kwh * price_per
seller_before = w3.eth.get_balance(HOUSE_A["addr"])
send(contract.functions.buyEnergy(0), HOUSE_C, value=cost)
print(f"  House_C paid {eth(cost)} ETH for {kwh} kWh")
print(f"  Escrow held by contract: {eth(w3.eth.get_balance(CONTRACT_ADDRESS))} ETH  (seller NOT paid yet)")
print(f"  Trades on-chain: {contract.functions.tradeCount().call()}")

print("\nSTEP 4: Oracle confirms delivery -> escrow releases to seller")
send(contract.functions.confirmDelivery(0), ORACLE)
seller_after = w3.eth.get_balance(HOUSE_A["addr"])
print(f"  Seller (House_A) balance change: +{eth(seller_after - seller_before)} ETH")
print(f"  Escrow now: {eth(w3.eth.get_balance(CONTRACT_ADDRESS))} ETH  (released)")

print("\n=== Market cycle complete ===")
print("weather -> AI forecast -> on-chain listing -> escrow trade -> oracle settlement")
