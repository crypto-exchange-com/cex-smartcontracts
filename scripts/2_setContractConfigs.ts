import { ethers } from "hardhat";

let owner: any;
const cexTokenAddress = "0xc99550BFf9212933c97172834ab641684E86CD7C";
const stakeContractAddress = "0x9e202FA5af63F9238a78f3A019Ea00A22241FE6a";
const feeDistributorAddress = "0xfB38EB8090e50061DB803C050e4D096961107D69";

async function main() {
  [owner] = await ethers.getSigners();
  console.log("Setting End Date...");
  const stakeContract = await ethers.getContractFactory(
    "SecondChanceStakingTokenBank"
  );
  const stakeContractInstance = await stakeContract.attach(
    stakeContractAddress
  );
  const rewardContract = await ethers.getContractFactory(
    "SecondChanceRewardDistributor"
  );
  const rewardContractInstance = await rewardContract.attach(
    feeDistributorAddress
  );
  const cexContract = await ethers.getContractFactory("CryptoExchange");
  const cexContractInterface = await cexContract.attach(cexTokenAddress);

  // setting stake contract end dates
  await stakeContractInstance
    .setPoolEndDate(
      1672873200, // Thursday, January 5, 2023 12:00:00 AM GMT+01:00
      { gasLimit: 300000 }
    )
    .then(async (tx) => {
      await tx.wait(1);

      await stakeContractInstance
        .setWindowEnd(
          1672873200, // Thursday, January 5, 2023 12:00:00 AM GMT+01:00
          { gasLimit: 300000 }
        )
        .then(async (tx) => {
          await tx.wait(1);
          console.log("Pool end date and window end are set!");
        });
    });

  // Setting distributor release date
  // set Release date 11 months in future, after 30 days 10% is released, then another 10% after 30 days. future months are 5%
  await rewardContractInstance
    .setReleaseDate(1670194800, { gasLimit: 300000 })
    .then(async (tx) => {
      await tx.wait(1);
      console.log("Release date is set!");
    });
  // Monday, December 5, 2022 12:00:00 AM GMT+01:00

  // Setting fee exclusions for owner and distributor
  // console.log("Setting fee exclusions...");
  // await cexContractInterface.AddFeeExclusion(owner.address).then(async (tx) => {
  //   await tx.wait(1);
  //   console.log("Owner excluded from fee");
  //
  //   await cexContractInterface
  //     .AddFeeExclusion(feeDistributorAddress)
  //     .then(async (tx) => {
  //       await tx.wait(1);
  //       console.log("Fee distributor excluded from fee");
  //     });
  // });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
