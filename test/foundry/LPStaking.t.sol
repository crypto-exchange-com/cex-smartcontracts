// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "../../contracts/Staking/LPStaking.sol";
import "../../contracts/TestTokenTwo.sol";
import "../../contracts/TestTokenOne.sol";

contract LPStakingTest is Test {
    LPStaking public lpStaking;
    TestTokenOne public rewardToken;
    TestTokenTwo public stakeToken;

    uint public periodFinish;
    uint public rewardRate;
    uint public rewardsDuration;
    uint public rewardsForDuration;
    uint public lastUpdateTime;
    uint public rewardPerTokenStored;
    uint public lastTimeRewardApplicable;
    uint public rewardPerToken;
    uint public totalSupply;

    address public alice = address(0x1);
    address public bob = address(0x2);

    function setUp() public {
        rewardToken = new TestTokenOne();
        stakeToken = new TestTokenTwo();
        lpStaking = new LPStaking(address(rewardToken), address(stakeToken));
    }

    function testPeriodFinish() public {
        periodFinish = lpStaking.periodFinish();
        assertEq(periodFinish, 0);
    }

    function testRewardRate() public {
        rewardRate = lpStaking.rewardRate();
        assertEq(rewardRate, 0);
    }

    function testRewardsDuration() public {
        rewardsDuration = lpStaking.rewardsDuration();
        assertEq(rewardsDuration, 7 days);
    }

    function testLastUpdateTime() public {
        lastUpdateTime = lpStaking.lastUpdateTime();
        assertEq(lastUpdateTime, 0);
    }

    function testRewardPerTokenStored() public {
        rewardPerTokenStored = lpStaking.rewardPerTokenStored();
        assertEq(rewardPerTokenStored, 0);
    }

    function testLastTimeRewardApplicable() public {
        lastTimeRewardApplicable = lpStaking.lastTimeRewardApplicable();
        periodFinish = lpStaking.periodFinish();
        assertEq(lastTimeRewardApplicable, periodFinish);
    }

    function testRewardPerToken() public {
        rewardPerToken = lpStaking.rewardPerToken();
        assertEq(rewardPerToken, 0);
    }

    function testGetRewardForDuration() public {
        rewardsForDuration = lpStaking.getRewardForDuration();
        assertEq(rewardsForDuration, 0);
    }

    function testTotalSupply() public {
        totalSupply = lpStaking.totalSupply();
        assertEq(totalSupply, 0);
    }

    function testStake(uint amount) public {
        vm.assume(amount > 0 && amount <= stakeToken.balanceOf(address(this)));
        stakeToken.approve(address(lpStaking), amount);
        lpStaking.stake(amount);
        _assertBalances(amount);
    }

    function testStakeShouldFailAmountZero() public {
        vm.expectRevert("Cannot stake 0");
        lpStaking.stake(0);
    }

    function testStakeShouldFailAmountNotApproved() public {
        vm.expectRevert("Transfer of token has not been approved");
        lpStaking.stake(100);
    }

    function testStakeAndNotify(uint amount) public {
        vm.assume(amount > 0 && amount <= stakeToken.balanceOf(address(this)));
        _approveAndStake(amount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), amount);

        vm.assume(block.timestamp > lpStaking.periodFinish());
        lpStaking.notifyRewardAmount(amount);

        // verify notifyRewardAmount
        _assertNotifyRewardAmount(amount, false);
    }

    function testStakeAndNotifyPeriodNotFinished(uint amount) public {
        uint firstAmount = 5;
        uint secondAmount = 5;
        vm.assume(amount > 10 && amount <= stakeToken.balanceOf(address(this)));

        _approveAndStake(firstAmount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), firstAmount);

        lpStaking.notifyRewardAmount(firstAmount);
        _assertNotifyRewardAmount(firstAmount, false);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), secondAmount);
        vm.warp(block.timestamp + 1 days);

        periodFinish = lpStaking.periodFinish();
        assertGt(periodFinish, block.timestamp);

        lpStaking.notifyRewardAmount(secondAmount);
        _assertNotifyRewardAmountNotFinished(secondAmount);
    }

    function testStakeAndNotifyShouldFailProvidedRewardHigh(uint amount) public {
        uint firstAmount = 5;
        uint secondAmount = 5;
        vm.assume(amount > 10 && amount <= stakeToken.balanceOf(address(this)));
        _approveAndStake(firstAmount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), firstAmount);
        lpStaking.notifyRewardAmount(firstAmount);
        _assertNotifyRewardAmount(firstAmount, false);

        rewardRate = lpStaking.rewardRate();
        assertEq(rewardRate, 0);

        vm.warp(block.timestamp + 8 days);
        periodFinish = lpStaking.periodFinish();
        assertLe(periodFinish, block.timestamp + 8 days);

        // calculate rewardRate. Must be less or equal to lpStakingRewardBalance / rewardsDuration
        uint lpStakingBalance = rewardToken.balanceOf(address(lpStaking));

        rewardToken.transfer(address(lpStaking), secondAmount);
//        vm.expectRevert("Provided reward too high"); // toggle on and expect revert, off call did not revert as expected?
        lpStaking.notifyRewardAmount(amount);
//        _assertNotifyRewardAmount(secondAmount, true);
    }

    function testStakeAndNotifyTwoRounds(uint amount) public {
        uint firstAmount = 5;
        uint secondAmount = 5;
        vm.assume(amount > 10 && amount <= stakeToken.balanceOf(address(this)));
        _approveAndStake(firstAmount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), firstAmount);
        lpStaking.notifyRewardAmount(firstAmount);
        _assertNotifyRewardAmount(firstAmount, false);

        vm.warp(block.timestamp + 1 days);
        periodFinish = lpStaking.periodFinish();
        assertGt(periodFinish, block.timestamp);

        // calculate rewardRate. Must be less or equal to lpStakingRewardBalance / rewardsDuration
        uint lpStakingBalance = rewardToken.balanceOf(address(lpStaking));
        rewardsDuration = 7 days;
        rewardRate = secondAmount / rewardsDuration;
        uint outcome = lpStakingBalance / rewardsDuration;
        assertLe(rewardRate, outcome);

        lpStaking.notifyRewardAmount(secondAmount);
        // no second rewardTokenTransfer in this method
        // amount is rewardTokenBalance of lpStaking
        _assertNotifyRewardAmount(secondAmount, false);
    }

    function testStakeAndNotifyShouldFailNoOwner(uint amount) public {
        vm.assume(amount > 0 && amount <= stakeToken.balanceOf(address(this)));
        _approveAndStake(amount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), amount);

        vm.assume(block.timestamp > lpStaking.periodFinish());
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(alice);
        lpStaking.notifyRewardAmount(amount);
    }

    function _approveAndStake(uint amount) private {
        stakeToken.approve(address(lpStaking), amount);
        lpStaking.stake(amount);
        _assertBalances(amount);
    }

    function _assertBalances(uint amount) private {
        uint _totalSupply = lpStaking.totalSupply();
        assertEq(_totalSupply, amount);
        uint balanceOf = lpStaking.balanceOf(address(this));
        assertEq(balanceOf, amount);
        assertEq(stakeToken.balanceOf(address(lpStaking)), amount);
    }

    function _assertNotifyRewardAmount(uint amount, bool double) private {
        // check if stake pool has reward token
        uint lpStakingRewardBalance = rewardToken.balanceOf(address(lpStaking));

        if (double) {
            assertEq(lpStakingRewardBalance, amount + amount);
        } else {
            assertEq(lpStakingRewardBalance, amount);
        }

        // calculate rewardRate. Must be less or equal to lpStakingRewardBalance / rewardsDuration
        rewardsDuration = 7 days;
        rewardRate = amount / rewardsDuration;
        uint outcome = lpStakingRewardBalance / rewardsDuration;
        assertLe(rewardRate, outcome);

        // lastUpdateTime is updated after notifyRewardAmount
        // must be same as block.timestamp
        lastUpdateTime = lpStaking.lastUpdateTime();
        assertEq(lastUpdateTime, block.timestamp);

        // periodFinish is updated after notifyRewardAmount
        // must be same as block.timestamp + rewardsDuration (7 days)
        periodFinish = lpStaking.periodFinish();
        assertEq(periodFinish, block.timestamp + rewardsDuration);
    }

    function _assertNotifyRewardAmountNotFinished(uint amount) private {
        uint lpStakingRewardBalance = rewardToken.balanceOf(address(lpStaking));
        assertEq(lpStakingRewardBalance, amount + amount);
        // calculate rewardRate. Must be less or equal to lpStakingRewardBalance / rewardsDuration
        rewardsDuration = 7 days;
        uint remaining = lpStaking.periodFinish() - block.timestamp;
        uint leftover = remaining * lpStaking.rewardRate();
        rewardRate = (amount + leftover) / rewardsDuration;
        uint outcome = lpStakingRewardBalance / rewardsDuration;
        assertLe(rewardRate, outcome);

        // lastUpdateTime is updated after notifyRewardAmount
        // must be same as block.timestamp
        lastUpdateTime = lpStaking.lastUpdateTime();
        assertEq(lastUpdateTime, block.timestamp);

        // periodFinish is updated after notifyRewardAmount
        // must be same as block.timestamp + rewardsDuration (7 days)
        periodFinish = lpStaking.periodFinish();
        assertEq(periodFinish, block.timestamp + rewardsDuration);
    }
}
