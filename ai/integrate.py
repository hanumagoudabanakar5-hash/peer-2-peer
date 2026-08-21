import json
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
assert w3.is_connected(), "Not connected — is the node running?"

with open("contract_address.txt") as f:
    CONTRACT_ADDRESS = Web3.to_checksum_address(f.read().strip())
print("Using contract at:", CONTRACT_ADDRESS)

assert w3.eth.get_code(CONTRACT_ADDRESS) != b'', "No contract at that address — redeploy!"
print("Confirmed: contract code exists at address.")

with open("../contracts/artifacts/contracts/EnergyTrading.sol/EnergyTrading.json") as f:
    abi = json.load(f)["abi"]
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)

ORACLE = Web3.to_checksum_address("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

print("Registering House_A...")
tx = contract.functions.register("House_A").build_transaction({
    "from": ORACLE, "nonce": w3.eth.get_transaction_count(ORACLE),
})
signed = w3.eth.account.sign_transaction(tx, KEY)
h = w3.eth.send_raw_transaction(signed.raw_transaction)
w3.eth.wait_for_transaction_receipt(h)
print("Registered.")

household = contract.functions.households(ORACLE).call()
print("Read back -> registered:", household[0], "| name:", household[1])
