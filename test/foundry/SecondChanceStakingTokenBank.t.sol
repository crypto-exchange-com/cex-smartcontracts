// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "forge-std/Test.sol";

import "../../contracts/staking/SecondChanceStakingTokenBank.sol";
import "../../contracts/TestTokenOne.sol";
import "../../contracts/TestTokenTwo.sol";
import "../../contracts/models/StakeEntry.sol";

contract SecondChanceStakingTokenBankTest is Test {
    SecondChanceStakingTokenBank public stakeVault;
    TestTokenOne public testTokenOne;
    TestTokenTwo public testTokenTwo;

    StakeEntry public stakeEntry;

    address public owner = address(0x1234);
    address public alice = address(0xABCD);
    address public bob = address(0xDCBA);

    uint currentTimestamp;
    uint laterTimestamp;
    uint windowEndDate;
    uint poolEndDate;
    uint baseFee;
    uint penaltyFee;

    function setUp() public {
        currentTimestamp = block.timestamp;
        laterTimestamp = currentTimestamp + 5 seconds;
        windowEndDate = currentTimestamp + 5 days;
        poolEndDate = currentTimestamp + 10 days;

        baseFee = 5;
        penaltyFee = 10;

        stakeVault = new SecondChanceStakingTokenBank(poolEndDate, currentTimestamp, windowEndDate, baseFee, penaltyFee);

        vm.startPrank(owner); // owner will be owner of tokens
        testTokenOne = new TestTokenOne();
        testTokenTwo = new TestTokenTwo();
        vm.stopPrank();
    }

    function testTimeStampIsSet() public {
        assertEq(stakeVault.WindowStart(), currentTimestamp);
        assertEq(stakeVault.WindowEnd(), windowEndDate);
        assertEq(stakeVault.PoolEndDate(), poolEndDate);
    }

    function testSetTimestampAndCompare() public {
        currentTimestamp = block.timestamp;
        laterTimestamp = currentTimestamp + 1 days;
        vm.warp(laterTimestamp);
        currentTimestamp = block.timestamp;
        assertEq(currentTimestamp, laterTimestamp);
    }

    function testSetTimestampToFuture() public {
        uint startDate = block.timestamp + 1 days;
        assertGt(startDate, currentTimestamp);

        uint afterEndDate = startDate + 1 days;
        vm.warp(afterEndDate);
        currentTimestamp = block.timestamp;
        assertGt(currentTimestamp, startDate);
    }

    function testStakeShouldFailNoAllowance(uint amount) public {
        vm.assume(amount > 0 && amount <= testTokenOne.balanceOf(owner));
        _transfer(amount);
        vm.prank(alice);
        vm.expectRevert("Allowance not set");
        stakeVault.stake(address(testTokenOne));
    }

    function testStakeShouldFailCannotStakeBeforeStart(uint amount) public {
        vm.assume(amount > 0 && amount <= testTokenOne.balanceOf(owner));

        uint windowStart = stakeVault.WindowStart();
        stakeVault.setWindowStart(windowStart + 1 days);
        uint timestamp = block.timestamp + 1 hours;

        assertGt(timestamp, windowStart);
        vm.warp(timestamp);

        _transfer(amount);
        // assertEq balanceOf alice
        assertEq(testTokenOne.balanceOf(alice), amount);
        vm.startPrank(alice);
        testTokenOne.approve(address(stakeVault), amount);
        vm.expectRevert("Cannot stake before start");
        stakeVault.stake(address(testTokenOne));
        vm.stopPrank();
    }

    function testStakeShouldFailCannotStakeAfterWindowEnd(uint amount) public {
        vm.assume(amount > 0 && amount <= testTokenOne.balanceOf(owner));

        // stake after windowEndDate
        uint futureDate = windowEndDate + 1 days;
        vm.warp(futureDate);

        _transfer(amount);

        vm.startPrank(alice);
        testTokenOne.approve(address(stakeVault), amount);
        vm.expectRevert("Cannot stake after end");
        stakeVault.stake(address(testTokenOne));
        vm.stopPrank();
    }

    function testStake(uint amount) public {
        vm.assume(amount > 0 && amount <= testTokenOne.balanceOf(owner));
        currentTimestamp = block.timestamp;
        //Cannot stake before start
        vm.warp(currentTimestamp + 1 hours);

        _transfer(amount);

        vm.startPrank(alice);
        testTokenOne.approve(address(stakeVault), amount);
        stakeVault.stake(address(testTokenOne));
        vm.stopPrank();
        // get lastId
        uint lastId = stakeVault.LastId();
        assertEq(lastId, 1);
        uint256[] memory ids = stakeVault.stakeEntryIdsFullMapping(alice);
        assertEq(ids.length, 1);

        _assertStakeEntry(lastId, address(alice), address(testTokenOne), amount, poolEndDate);
    }

    function testUnstakeShouldFailNotAllowed(uint amount) public {
        vm.assume(amount > 0 && amount <= testTokenOne.balanceOf(owner));
        currentTimestamp = block.timestamp;
        //Cannot stake before start
        vm.warp(currentTimestamp + 1 hours);

        _transfer(amount);

        vm.startPrank(alice);
        testTokenOne.approve(address(stakeVault), amount);
        stakeVault.stake(address(testTokenOne));
        vm.stopPrank();
        uint lastId = stakeVault.LastId();
        assertEq(lastId, 1);

        vm.prank(bob);
        vm.expectRevert("not allowed to unstake this entry");
        stakeVault.unStake(lastId);
    }

    function testUnstakeShouldFailAlreadyUnstaked(uint amount) public {
        vm.assume(amount > 0 && amount <= testTokenOne.balanceOf(owner));
        currentTimestamp = block.timestamp;
        //Cannot stake before start
        vm.warp(currentTimestamp + 1 hours);

        _transfer(amount);

        vm.startPrank(alice);
        testTokenOne.approve(address(stakeVault), amount);
        stakeVault.stake(address(testTokenOne));
        uint lastId = stakeVault.LastId();
        assertEq(lastId, 1);
        stakeVault.unStake(lastId);

        vm.expectRevert("already unstaked");
        stakeVault.unStake(lastId);
    }

    function testUnstakeTakePenaltyFee(uint amount) public {
        vm.assume(amount > 0 && amount <= testTokenOne.balanceOf(owner));
        currentTimestamp = block.timestamp;
        //Cannot stake before start
        vm.warp(currentTimestamp + 1 hours);
        currentTimestamp = block.timestamp;

        _transfer(amount);

        vm.startPrank(alice);
        testTokenOne.approve(address(stakeVault), amount);
        stakeVault.stake(address(testTokenOne));
        uint lastId = stakeVault.LastId();
        assertEq(lastId, 1);

        StakeEntry memory entry = stakeVault.getStakeEntry(lastId);
        // Unstaking before period finish should take penalty fee
        assertLt(currentTimestamp, entry.PeriodFinish);

        stakeVault.unStake(lastId);

        uint fee = amount * penaltyFee / 100;
        uint amountToTransfer = amount - fee;
        assertEq(testTokenOne.balanceOf(alice), amountToTransfer);
        assertEq(testTokenOne.balanceOf(address(this)), fee);
    }

    function testUnstakeTakeBaseFee(uint amount) public {
        vm.assume(amount > 0 && amount <= testTokenOne.balanceOf(owner));
        currentTimestamp = block.timestamp;
        // Date after PeriodFinish
        vm.warp(currentTimestamp + 2 days);
        currentTimestamp = block.timestamp;

        _transfer(amount);

        vm.startPrank(alice);
        testTokenOne.approve(address(stakeVault), amount);
        stakeVault.stake(address(testTokenOne));
        uint lastId = stakeVault.LastId();
        assertEq(lastId, 1);

        StakeEntry memory entry = stakeVault.getStakeEntry(lastId);

        // Set date after period finish / poolEndDate so base fee is taken
        currentTimestamp = poolEndDate + 2 days;
        vm.warp(currentTimestamp);
        assertGt(currentTimestamp, entry.PeriodFinish);

        stakeVault.unStake(lastId);

        uint fee = (amount * baseFee) / 100;
        uint amountToTransfer = amount - fee;
        assertEq(testTokenOne.balanceOf(alice), amountToTransfer);
        assertEq(testTokenOne.balanceOf(address(this)), fee);
    }

    function testSetPoolEndDate(uint endDate) public {
        vm.assume(endDate > poolEndDate);
        stakeVault.setPoolEndDate(endDate);
        assertEq(stakeVault.PoolEndDate(), endDate);
    }

    function testSetPoolEndDateShouldFailNoOwner(uint endDate) public {
        vm.assume(endDate > poolEndDate);
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        stakeVault.setPoolEndDate(endDate);
    }

    function testSetPoolEndDateShouldFailSetBeforePoolEndDate(uint endDate) public {
        vm.assume(endDate > block.timestamp && endDate < poolEndDate);
        vm.expectRevert("cannot set to a date before the current PoolEndDate");
        stakeVault.setPoolEndDate(endDate);
    }

    function testWindowStart(uint startDate) public {
        vm.assume(startDate > currentTimestamp);
        stakeVault.setWindowStart(startDate);
        assertEq(stakeVault.WindowStart(), startDate);
    }

    function testWindowStartShouldFailNoOwner(uint startDate) public {
        vm.assume(startDate > currentTimestamp);
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        stakeVault.setWindowStart(startDate);
    }

    function testWindowStartShouldFailBeforeCurrentTimestamp(uint startDate) public {
        vm.assume(startDate < currentTimestamp);
        vm.expectRevert("cannot set to a date before the current WindowStart");
        stakeVault.setWindowStart(startDate);
    }

    function testWindowEndShouldFailBeforeCurrentTimestamp(uint endDate) public {
        vm.assume(endDate < currentTimestamp);
        vm.expectRevert("cannot set to a date before the current WindowStart");
        stakeVault.setWindowEnd(endDate);
    }

    function testWindowEndShouldFailBeforeWindowEnd(uint endDate) public {
        vm.assume(endDate > block.timestamp);
        vm.assume(endDate < windowEndDate);
        vm.expectRevert("cannot set to a date before the current WindowEnd");
        stakeVault.setWindowEnd(endDate);
    }

    function testWindowEndShouldFailBeforePoolEndDate(uint endDate) public {
        vm.assume(endDate > windowEndDate);
        vm.assume(endDate > poolEndDate);
        vm.expectRevert("cannot set to a date after the current PoolEndDate");
        stakeVault.setWindowEnd(endDate);
    }

    function testWindowEndNoOwner() public {
        uint endDate = windowEndDate + 1 days;
        vm.assume(endDate < poolEndDate);
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        stakeVault.setWindowEnd(endDate);
    }

    function testWindowEnd(uint endDate) public {
        vm.assume(endDate > windowEndDate);
        vm.assume(endDate < poolEndDate);
        stakeVault.setWindowEnd(endDate);
        assertEq(stakeVault.WindowEnd(), endDate);
    }

    function testSetBaseFee(uint fee) public {
        vm.assume(fee > 0);
        stakeVault.setBaseFee(fee);
        assertEq(stakeVault.BaseFee(), fee);
    }

    function testSetBaseFeeNoOwner(uint fee) public {
        vm.assume(fee > 0);
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        stakeVault.setBaseFee(fee);
    }

    function testSetPenaltyFee(uint fee) public {
        vm.assume(fee > 0);
        stakeVault.setPenaltyFee(fee);
        assertEq(stakeVault.PenaltyFee(), fee);
    }

    function testSetPenaltyFeeNoOwner(uint fee) public {
        vm.assume(fee > 0);
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        stakeVault.setPenaltyFee(fee);
    }

    function _transfer(uint amount) private {
        vm.prank(owner);
        // transfer tokens to alice
        testTokenOne.transfer(alice, amount);
    }

    function _assertStakeEntry(uint id, address user, address token, uint amount, uint periodFinish) private {
        vm.prank(user);
        StakeEntry memory entry = stakeVault.getStakeEntry(id);
        assertEq(entry.Staker, user);
        assertEq(entry.Amount, amount);
        assertEq(entry.TokenAddress, token);
        assertEq(entry.PeriodFinish, periodFinish);
    }
}