// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "../../contracts/rewards/SecondChanceRewardDistributor.sol";
import "../../contracts/CryptoExchange.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../../contracts/Helpers/Merkle.sol";

contract SecondChanceRewardDistributorTest is Test {
    uint256 constant private DECIMALS = 18;
    using SafeMath for uint256;

    CryptoExchange public rewardToken;
    SecondChanceRewardDistributor public rewardDistributor;
    uint public releaseDate;
    bytes32 public merkleRoot;

    bytes32[] public merkleTree;

    Merkle public merkle;

    address public feeRecipient = address(0x1);
    address public alice = address(0x2);
    address public bob = address(0x3);

    function setUp() public {
        rewardToken = new CryptoExchange(feeRecipient);

        merkle = new Merkle();

        rewardDistributor = new SecondChanceRewardDistributor(address(rewardToken));
        releaseDate = block.timestamp + 1 days; // release data is set 1 day in futute! important for rewards

        rewardToken.addFeeExclusion(address(this));
        rewardToken.addFeeExclusion(address(rewardDistributor));
        rewardToken.addFeeExclusion(address(feeRecipient));
    }

    function testSetMerkleProof(bytes32 _merkleRoot) public {
        merkleRoot = _getSetMerkleRoot(_merkleRoot);
        bytes32 root = rewardDistributor.merkleRoot();
        assertEq(root, _merkleRoot, "Merkle root should be set");
    }

    function testSetReleaseDateShouldFailNotInFuture(uint _releaseDate) public {
        vm.assume(_releaseDate < block.timestamp);
        vm.expectRevert("Release date has to be in the future");
        rewardDistributor.setReleaseDate(_releaseDate);
    }

    function testSetReleaseDate(uint _releaseDate) public {
        vm.assume(_releaseDate > block.timestamp);
        rewardDistributor.setReleaseDate(_releaseDate);
        releaseDate = rewardDistributor.ReleaseDate();
        assertEq(releaseDate, _releaseDate, "Release date should be set");
    }

    function testWithdrawShouldFailMerkleRootNotSet(uint amount, bytes32 _merkleRoot) public {
        vm.assume(amount > 0 && amount <= rewardToken.balanceOf(address(this)));
        _transferRewardToken(amount);
        // convert bytes32 to bytes32[] memory
        bytes32[] memory _merkleProof = new bytes32[](1);
        _merkleProof[0] = _merkleRoot;
        vm.expectRevert("merkle root not set");
        rewardDistributor.withdraw(amount, _merkleProof);
    }

    function testWithdrawShouldFailNotEnoughFunds(uint amount, bytes32 _merkleRoot) public {
        vm.assume(amount > 0 && amount <= rewardToken.balanceOf(address(this)));
        merkleRoot = _getSetMerkleRoot(_merkleRoot);

        // check if merkleRoot = ""
        assertEq(merkleRoot, _merkleRoot, "merkle root not set");

        // convert bytes32 to bytes32[] memory
        bytes32[] memory _merkleProof = new bytes32[](1);
        _merkleProof[0] = merkleRoot;
        vm.expectRevert("Not enough funds left");
        rewardDistributor.withdraw(amount, _merkleProof);
    }

    function testWithdrawShouldFailIncorrectProof(uint amount, bytes32 wrongProof) public {
        vm.assume(amount > 0 && amount <= rewardToken.balanceOf(address(this)));
        _transferRewardToken(amount);

        _pushLeaf(amount, alice); // no single leafs in tree
        _pushLeaf(amount, alice); // no single leafs in tree
        _verifyMerkle(amount, alice);
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = wrongProof;
        vm.expectRevert("Incorrect proof");
        rewardDistributor.withdraw(amount, proof);
    }

    function testWithdrawShouldFailNotStarted(uint amount) public {
        vm.assume(amount > 0 && amount <= rewardToken.balanceOf(address(this)));
        _transferRewardToken(amount);

        _pushLeaf(amount, alice); // no single leafs in tree

        _pushLeaf(amount, bob);
        bytes32[] memory proof = _verifyMerkle(amount, bob);
        vm.expectRevert("Release has not started yet!");
        vm.prank(bob);
        rewardDistributor.withdraw(amount, proof);
    }

    function testWithdrawShouldFailNotEnoughFunds(uint amount) public {
        uint totalBalance = rewardToken.balanceOf(address(this));
        _transferRewardToken(totalBalance);
        vm.assume(amount > totalBalance);

        uint release = block.timestamp + 1 seconds;
        _setReleaseDate(release); // block.timestamp + 1 seconds
        vm.warp(release + 2 seconds); //

        _pushLeaf(amount, alice); // no single leafs in tree

        _pushLeaf(amount, bob);
        bytes32[] memory proof = _verifyMerkle(amount, bob);
        vm.expectRevert("Not enough funds left");
        vm.prank(bob);
        rewardDistributor.withdraw(amount, proof);
    }

    function testWithdrawTwoCycles(uint256 amount) public {
        vm.assume(amount > 1*10**18 && amount <= (rewardToken.balanceOf(address(this))) / 2);

        _transferRewardToken(rewardToken.balanceOf(address(this)));

        uint release = block.timestamp + 1 seconds;
        _setReleaseDate(release); // block.timestamp + 1 seconds
        vm.warp(release + 32 days); // 1 phases passed

        _pushLeaf(amount, alice);
        _pushLeaf(amount, bob);
        bytes32[] memory proof = _verifyMerkle(amount, bob);

        uint toRelease = _calcWithdrawPhases(amount, 32 days, release);

        vm.startPrank(bob);
        rewardDistributor.withdraw(amount, proof);

        uint RewardAmountClaimed = rewardDistributor.RewardAmountClaimed(bob);
        assertEq(RewardAmountClaimed, toRelease);

        // rewards are transferred to bob, balance should be toRelease. Distributor is excluded from fee
        uint balanceBob = rewardToken.balanceOf(bob);
        assertEq(toRelease, balanceBob);


        vm.warp(release + 64 days); // 2 phases passed

        toRelease = _calcWithdrawPhases(amount, 64 days, release); // new release cycle
        rewardDistributor.withdraw(amount, proof);

        uint balanceBobAfter = rewardToken.balanceOf(bob);
        assertEq(balanceBobAfter, toRelease);
        vm.stopPrank();
    }

    function testWithdrawSixteenPhases(uint256 amount) public {
        vm.assume(amount > 1*10**18 && amount <= (rewardToken.balanceOf(address(this))) / 2);

        _transferRewardToken(rewardToken.balanceOf(address(this)));

        uint release = block.timestamp + 1 seconds;
        _setReleaseDate(release); // block.timestamp + 1 seconds
        vm.warp(release + 480 days); // 16 phases passed

        _pushLeaf(amount, alice);
        _pushLeaf(amount, bob);
        bytes32[] memory proof = _verifyMerkle(amount, bob);

        uint toRelease = _calcWithdrawPhases(amount, 480 days, release);

        vm.startPrank(bob);
        rewardDistributor.withdraw(amount, proof);

        uint RewardAmountClaimed = rewardDistributor.RewardAmountClaimed(bob);
        assertEq(RewardAmountClaimed, toRelease);

        // rewards are transferred to bob, balance should be toRelease. Distributor is excluded from fee
        uint balanceBob = rewardToken.balanceOf(bob);
        assertEq(toRelease, balanceBob);

        vm.stopPrank();
    }

    function testWithdrawShouldFailTotalAmountClaimedEighteenPhases(uint256 amount) public {
        vm.assume(amount > 1*10**18 && amount <= (rewardToken.balanceOf(address(this))) / 2);

        _transferRewardToken(rewardToken.balanceOf(address(this)));

        uint release = block.timestamp + 1 seconds;
        _setReleaseDate(release); // block.timestamp + 1 days
        vm.warp(release + 545 days); // 18 phases passed

        _pushLeaf(amount, alice);
        _pushLeaf(amount, bob);
        bytes32[] memory proof = _verifyMerkle(amount, bob);

        uint toRelease = _calcWithdrawPhases(amount, 545 days, release);

        // all rewards are transferred
        assertEq(toRelease, amount);

        vm.startPrank(bob);
        rewardDistributor.withdraw(amount, proof);

        uint RewardAmountClaimed = rewardDistributor.RewardAmountClaimed(bob);
        assertEq(RewardAmountClaimed, toRelease);

        // rewards are transferred to bob, balance should be toRelease. Distributor is excluded from fee
        uint balanceBob = rewardToken.balanceOf(bob);
        assertEq(toRelease, balanceBob);

        vm.expectRevert("Total amount already claimed");
        rewardDistributor.withdraw(amount, proof);
        vm.stopPrank();
    }

    function _transferRewardToken(uint256 amount) internal {
        vm.assume(amount > 0 && amount <= rewardToken.balanceOf(address(this)));
        rewardToken.transfer(address(rewardDistributor), amount);
    }

    function _setReleaseDate(uint _releaseDate) internal {
        vm.assume(_releaseDate > block.timestamp);
        rewardDistributor.setReleaseDate(_releaseDate);
        releaseDate = rewardDistributor.ReleaseDate();
    }

    function _getSetMerkleRoot(bytes32 root) private returns(bytes32) {
        rewardDistributor.setMerkleRoot(root);
        return rewardDistributor.merkleRoot();
    }

    function _verifyMerkle(uint amount, address caller) internal returns(bytes32[] memory proof) {
        bytes32 leaf = keccak256(abi.encodePacked(caller, amount));

        bytes32 root = _getRoot();
        uint index = _getLeafIndex(leaf);
        proof = merkle.getProof(merkleTree, index);

        bool verified = merkle.verifyProof(root, proof, leaf);
        assertTrue(verified);

        bytes32 contractRoot = _getSetMerkleRoot(root);
        assertEq(contractRoot, root, "merkle root not set");

        assertTrue(MerkleProof.verify(proof, contractRoot, leaf));
    }

    function _pushLeaf(uint amount, address caller) private {
        bytes32 leaf = keccak256(abi.encodePacked(caller, amount));

        merkleTree.push(
            leaf
        );
    }

    function _getRoot() internal view returns(bytes32 root) {
        root = merkle.getRoot(merkleTree);
    }

    function _getLeafIndex(bytes32 leaf) internal view returns(uint index) {
        for (uint i = 0; i < merkleTree.length; i++) {
            if (merkleTree[i] == leaf) {
                index = i;
                break;
            }
        }
        return index;
    }

    function _calcWithdrawPhases(uint amount, uint passedDays, uint release) internal returns(uint256 toRelease) {
        uint256 elapsed = block.timestamp - release;
        assertEq(elapsed, passedDays);
        uint256 releaseTimes = elapsed / (30 * 1 days);
        toRelease = 0;

        if(releaseTimes > 18) releaseTimes = 18; //there cannot be more than 18 phases

        if (releaseTimes == 18) {
            toRelease = amount;
        } else {
            for(uint i = 0; i < releaseTimes; ++i){
                if(i == 0 || i == 1){//10%
                    toRelease += (amount / 100) * 10;
                }else{//5%
                    toRelease += (amount / 100) * 5;
                }
            }
        }
        // when withdraw is not called reward amount is 0;
        toRelease -= 0;
    }
}

