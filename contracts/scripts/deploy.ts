import { network } from "hardhat";
import { writeFileSync } from "fs";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("EnergyTrading");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = contract.target as string;
  console.log("EnergyTrading deployed to:", address);
  writeFileSync("../ai/contract_address.txt", address);
  console.log("Address written to ai/contract_address.txt");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
