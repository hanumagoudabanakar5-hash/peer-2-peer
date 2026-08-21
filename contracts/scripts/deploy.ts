import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const Factory = await ethers.getContractFactory("EnergyTrading");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  console.log("EnergyTrading deployed to:", contract.target);
  console.log("Oracle (deployer) is:", deployer.address);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
