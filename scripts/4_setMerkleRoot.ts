import { ethers } from "hardhat";
import axios from "axios";
import https from "https";

let owner: any;
const cexTokenAddress = "0xc99550BFf9212933c97172834ab641684E86CD7C";
const stakeContractAddress = "0x9e202FA5af63F9238a78f3A019Ea00A22241FE6a";
const feeDistributorAddress = "0xfB38EB8090e50061DB803C050e4D096961107D69";

const __LOCALHOST__ = false;

async function main() {
  [owner] = await ethers.getSigners();
  const rewardContract = await ethers.getContractFactory(
    "SecondChanceRewardDistributor"
  );
  const rewardContractInstance = await rewardContract.attach(
    feeDistributorAddress
  );
  let url =
    "https://secondchance-test-api.azurewebsites.net/staking/merkle-tree-root";

  if (__LOCALHOST__) {
    url = "https://localhost:5001/staking/merkle-tree-root";
    console.log("Using Localhost API for merkle tree root");
  }

  console.log("Getting merkle tree root from API...");
  await axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then(async (response) => {
      console.log("Setting Merkle tree root in contract... ", response.data);
      await rewardContractInstance
        .setMerkleRoot(response.data, { gasLimit: 300000 })
        .then(async (tx) => {
          await tx.wait(1);
          console.log(
            `Merkle root is set: ${await rewardContractInstance.merkleRoot()}`
          );
        });
    })
    .catch((error) => {
      console.log(`error`);
      console.log(error);
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
