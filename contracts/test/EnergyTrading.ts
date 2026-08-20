import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate("default");

describe("EnergyTrading", function () {
  async function deploy() {
    const [oracle, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EnergyTrading");
    const contract = await Factory.deploy();  // deployer = oracle
    return { contract, oracle, alice, bob };
  }

  it("registers a household", async function () {
    const { contract, alice } = await deploy();
    await contract.connect(alice).register("Alice House");
    const h = await contract.households(alice.address);
    expect(h.registered).to.equal(true);
    expect(h.name).to.equal("Alice House");
  });

  it("blocks double registration", async function () {
    const { contract, alice } = await deploy();
    await contract.connect(alice).register("Alice House");
    await expect(
      contract.connect(alice).register("Again")
    ).to.be.revertedWith("Already registered");
  });

  it("lets a registered seller list surplus", async function () {
    const { contract, alice } = await deploy();
    await contract.connect(alice).register("Alice House");
    await contract.connect(alice).listSurplus(5, ethers.parseEther("0.001"));
    expect(await contract.listingCount()).to.equal(1n);
  });

  it("runs a full escrow cycle: buy then oracle settles", async function () {
    const { contract, oracle, alice, bob } = await deploy();
    await contract.connect(alice).register("Alice Seller");
    await contract.connect(bob).register("Bob Buyer");

    const price = ethers.parseEther("0.001");
    await contract.connect(alice).listSurplus(5, price);
    const cost = 5n * price;

    // Bob pays into escrow
    await contract.connect(bob).buyEnergy(0, { value: cost });
    expect(await contract.tradeCount()).to.equal(1n);

    // Seller not paid yet — money is held by the contract
    expect(await ethers.provider.getBalance(contract.target)).to.equal(cost);

    // Oracle confirms delivery -> seller gets paid
    const before = await ethers.provider.getBalance(alice.address);
    await contract.connect(oracle).confirmDelivery(0);
    const after = await ethers.provider.getBalance(alice.address);
    expect(after - before).to.equal(cost);

    // Escrow is now empty
    expect(await ethers.provider.getBalance(contract.target)).to.equal(0n);
  });

  it("blocks a non-oracle from releasing funds", async function () {
    const { contract, alice, bob } = await deploy();
    await contract.connect(alice).register("Alice Seller");
    await contract.connect(bob).register("Bob Buyer");
    const price = ethers.parseEther("0.001");
    await contract.connect(alice).listSurplus(5, price);
    await contract.connect(bob).buyEnergy(0, { value: 5n * price });

    // Bob (not the oracle) tries to release the escrow to himself — must fail
    await expect(
      contract.connect(bob).confirmDelivery(0)
    ).to.be.revertedWith("Only oracle can confirm");
  });
});
