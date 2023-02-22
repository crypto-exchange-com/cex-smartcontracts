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
    TestTokenTwo public recoverToken;

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
        recoverToken = new TestTokenTwo();
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
        _assertBalances(amount);

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
        _assertBalances(firstAmount);

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
        _assertNotifyRewardAmount(secondAmount, true);
    }

    function testStakeAndNotifyShouldFailProvidedRewardHigh() public {
        uint firstAmount = 5 * 10**18;
        uint secondAmount = 5 * 10**18;
        uint amount = 15 * 10**18;
        _approveAndStake(firstAmount);
        _assertBalances(firstAmount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), firstAmount);
        lpStaking.notifyRewardAmount(firstAmount);
        _assertNotifyRewardAmount(firstAmount, false);
        uint lpStakingBalance = rewardToken.balanceOf(address(lpStaking));
        assertEq(lpStakingBalance, firstAmount);

        periodFinish = lpStaking.periodFinish(); // block.timestamp + 7 days

        vm.warp(block.timestamp + 1 days);
        assertGt(periodFinish, block.timestamp + 1 days);

        rewardsDuration = 7 days;
        uint256 remaining = periodFinish - block.timestamp;
        uint256 leftover = remaining * rewardRate;
        rewardRate = (amount + leftover) / rewardsDuration;

        // calculate rewardRate. Must be less or equal to lpStakingRewardBalance / rewardsDuration
        rewardToken.transfer(address(lpStaking), secondAmount);
        lpStakingBalance = rewardToken.balanceOf(address(lpStaking));

        uint totalBalance = firstAmount + secondAmount;
        assertEq(lpStakingBalance, totalBalance);
        uint balanceDivided = lpStakingBalance / rewardsDuration;
        assertGt(rewardRate, balanceDivided);

        vm.expectRevert("Provided reward too high"); // toggle on and expect revert, off call did not revert as expected?
        lpStaking.notifyRewardAmount(amount);
    }

    function testStakeAndNotifyTwoRounds() public {
        uint firstAmount = 5 * 10**18;
        uint secondAmount = 5 * 10**18;
        _approveAndStake(firstAmount);
        _assertBalances(firstAmount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), firstAmount);
        lpStaking.notifyRewardAmount(firstAmount);
        _assertNotifyRewardAmount(firstAmount, false);

        rewardPerToken = lpStaking.rewardPerToken();
        assertEq(rewardPerToken, 0);
        lastTimeRewardApplicable = lpStaking.lastTimeRewardApplicable();
        // block.timestamp is less than periodFinish
        // block.timestamp < periodFinish ? block.timestamp : periodFinish
        assertEq(lastTimeRewardApplicable, block.timestamp);

        vm.warp(block.timestamp + 1 days);
        periodFinish = lpStaking.periodFinish();
        assertGt(periodFinish, block.timestamp);

        // calculate rewardRate. Must be less or equal to lpStakingRewardBalance / rewardsDuration
        uint lpStakingBalance = rewardToken.balanceOf(address(lpStaking));
        rewardsDuration = 7 days;
        rewardRate = secondAmount / rewardsDuration;
        uint outcome = lpStakingBalance / rewardsDuration;
        assertLe(rewardRate, outcome);
        rewardToken.transfer(address(lpStaking), secondAmount);

        lpStaking.notifyRewardAmount(secondAmount);
        _assertNotifyRewardAmount(secondAmount, true);
    }

    function testStakeAndNotifyAmount(uint amount) public {
        uint maxAmount = stakeToken.balanceOf(address(this));
        uint dividedAmount = maxAmount / 2; // tokens are transferred two times as rewards. cannot exceed balance
        vm.assume(amount > 0 && amount <= dividedAmount);

        _approveAndStake(amount);
        _assertBalances(amount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), amount);
        lpStaking.notifyRewardAmount(amount);
        _assertNotifyRewardAmount(amount, false);

        rewardPerToken = lpStaking.rewardPerToken();
        assertEq(rewardPerToken, 0);
        lastTimeRewardApplicable = lpStaking.lastTimeRewardApplicable();
        // block.timestamp is less than periodFinish
        assertEq(lastTimeRewardApplicable, block.timestamp);

        vm.warp(block.timestamp + 1 days);
        periodFinish = lpStaking.periodFinish();
        assertGt(periodFinish, block.timestamp);

        // calculate rewardRate. Must be less or equal to lpStakingRewardBalance / rewardsDuration
        uint lpStakingBalance = rewardToken.balanceOf(address(lpStaking));
        rewardsDuration = 7 days;
        rewardRate = amount / rewardsDuration;
        uint outcome = lpStakingBalance / rewardsDuration;
        assertLe(rewardRate, outcome);
        rewardToken.transfer(address(lpStaking), amount);

        lpStaking.notifyRewardAmount(amount);
        _assertNotifyRewardAmount(amount, true);
    }

    function testStakeAndNotifyAmountWithLessRewards(uint amount, uint rewards) public {
        vm.assume(amount > 0 && amount <= stakeToken.balanceOf(address(this)));
        vm.assume(rewards > 0 && rewards < amount);

        _approveAndStake(amount);
        _assertBalances(amount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), amount);
        lpStaking.notifyRewardAmount(rewards);
        _assertNotifyRewardAmount(amount, false);

        rewardPerToken = lpStaking.rewardPerToken();
        assertEq(rewardPerToken, 0);
        lastTimeRewardApplicable = lpStaking.lastTimeRewardApplicable();
        // block.timestamp is less than periodFinish
        // block.timestamp < periodFinish ? block.timestamp : periodFinish
        assertEq(lastTimeRewardApplicable, block.timestamp);

        vm.warp(block.timestamp + 1 days);
        periodFinish = lpStaking.periodFinish();
        assertGt(periodFinish, block.timestamp);

        // calculate rewardRate. Must be less or equal to lpStakingRewardBalance / rewardsDuration
        uint lpStakingBalance = rewardToken.balanceOf(address(lpStaking));
        rewardsDuration = 7 days;
        rewardRate = rewards / rewardsDuration;
        uint outcome = lpStakingBalance / rewardsDuration;

        assertLe(rewardRate, outcome);
    }

    function testStakeCycleExit(uint amount, uint rewards) public {
        uint maxAmount = stakeToken.balanceOf(address(this));
        uint dividedAmount = maxAmount / 2; // tokens are transferred two times as rewards. cannot exceed balance
        vm.assume(amount > 0 && amount <= dividedAmount);
        vm.assume(rewards > 0 && rewards < dividedAmount);

        _approveAndStake(dividedAmount);
        _assertBalances(dividedAmount);

        stakeToken.transfer(alice, dividedAmount);

        vm.startPrank(alice);
        _approveAndStake(dividedAmount);
        vm.stopPrank();

        rewardToken.transfer(address(lpStaking), rewards);
        lpStaking.notifyRewardAmount(rewards);

        uint currentBlockTimestamp = block.timestamp;
        vm.warp(block.timestamp + 1 days);
        uint afterWarpBlockTimestamp = block.timestamp;
        assertGe(afterWarpBlockTimestamp, currentBlockTimestamp);

        periodFinish = lpStaking.periodFinish();
        assertGt(periodFinish, block.timestamp);

        uint earned = lpStaking.earned(alice);

        // calculate earned
        uint accountBalance = lpStaking.balanceOf(alice);
        rewardPerToken = lpStaking.rewardPerToken();
        uint rewardPerTokenPaid = lpStaking.userRewardPerTokenPaid(alice);
        uint _rewards = lpStaking.rewards(alice);
        uint calc = ((accountBalance * (rewardPerToken - rewardPerTokenPaid)) / 1e18) + _rewards;

        assertEq(earned, calc);

        rewardRate = lpStaking.rewardRate();
        rewardsDuration = 7 days;
        uint shouldBe = rewardRate * rewardsDuration;
        uint getRewardForDuration = lpStaking.getRewardForDuration();
        assertEq(getRewardForDuration, shouldBe);

        uint rewardsBalanceBeforeExit = rewardToken.balanceOf(alice);
        assertEq(rewardsBalanceBeforeExit, 0);

        // exit with earnings
        vm.startPrank(alice);
        lpStaking.exit();
        vm.stopPrank();

        uint balanceAfterExit = stakeToken.balanceOf(alice);
        assertEq(balanceAfterExit, dividedAmount);

        uint rewardsAfterExit = rewardToken.balanceOf(alice);
        assertEq(rewardsAfterExit, earned);
    }

    function testStakeCycleWithdraw() public {
        uint maxAmount = stakeToken.balanceOf(address(this));
        uint dividedAmount = maxAmount / 2; // tokens are transferred two times as rewards. cannot exceed balance
        uint amount = dividedAmount;

        _approveAndStake(dividedAmount);
        _assertBalances(dividedAmount);

        stakeToken.transfer(alice, dividedAmount);

        vm.startPrank(alice);
        _approveAndStake(dividedAmount);
        vm.stopPrank();

        rewardToken.transfer(address(lpStaking), amount);
        lpStaking.notifyRewardAmount(amount);

        uint currentBlockTimestamp = block.timestamp;
        vm.warp(block.timestamp + 1 days);
        uint afterWarpBlockTimestamp = block.timestamp;
        assertGe(afterWarpBlockTimestamp, currentBlockTimestamp);

        periodFinish = lpStaking.periodFinish();
        assertGt(periodFinish, block.timestamp);

        uint earned = lpStaking.earned(alice);

        // calculate earned
        uint accountBalance = lpStaking.balanceOf(alice);
        rewardPerToken = lpStaking.rewardPerToken();
        uint rewardPerTokenPaid = lpStaking.userRewardPerTokenPaid(alice);
        uint rewards = lpStaking.rewards(alice);
        uint calc = ((accountBalance * (rewardPerToken - rewardPerTokenPaid)) / 1e18) + rewards;

        assertEq(earned, calc);

        rewardRate = lpStaking.rewardRate();
        rewardsDuration = 7 days;
        uint shouldBe = rewardRate * rewardsDuration;
        uint getRewardForDuration = lpStaking.getRewardForDuration();
        assertEq(getRewardForDuration, shouldBe);

        uint rewardsBalanceBeforeExit = rewardToken.balanceOf(alice);
        assertEq(rewardsBalanceBeforeExit, 0);

        // withdraw with earnings
        vm.startPrank(alice);
        lpStaking.withdraw(dividedAmount);
        vm.stopPrank();

        uint balanceAfterExit = stakeToken.balanceOf(alice);
        assertEq(balanceAfterExit, dividedAmount);

        uint rewardsAfterExit = rewardToken.balanceOf(alice);
        assertEq(rewardsAfterExit, earned);
    }

    function testStakeAndNotifyShouldFailNoOwner(uint amount) public {
        vm.assume(amount > 0 && amount <= stakeToken.balanceOf(address(this)));
        _approveAndStake(amount);
        _assertBalances(amount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), amount);

        vm.assume(block.timestamp > lpStaking.periodFinish());
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(alice);
        lpStaking.notifyRewardAmount(amount);
    }

    function testRecoverERC20ShouldFailNoOwner() public {
        uint amount = 1000;
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(alice);
        lpStaking.recoverERC20(address(recoverToken), amount);
    }

    function testRecoverERC20ShouldFailStakeToken() public {
        uint amount = 1000;
        vm.expectRevert("Cannot withdraw the staking token");
        lpStaking.recoverERC20(address(stakeToken), amount);
    }

    function testRecoverERC20ShouldFailRewardToken() public {
        uint amount = 1000;
        vm.expectRevert("Cannot withdraw the reward token");
        lpStaking.recoverERC20(address(rewardToken), amount);
    }

    function testRecoverERC20() public {
        uint amount = 1000;
        recoverToken.transfer(address(alice), amount);

        vm.prank(alice);
        recoverToken.transfer(address(lpStaking), amount);

        uint ownerBalanceBefore = recoverToken.balanceOf(address(this));

        // prank is over, back to owner
        lpStaking.recoverERC20(address(recoverToken), amount);
        // recover sends tokens to owner of lpStaking
        uint ownerBalanceAfter = recoverToken.balanceOf(address(this));
        assertEq(ownerBalanceAfter, ownerBalanceBefore + amount);
    }

    function testSetRewardDurationShouldFailNoOwner() public {
        vm.warp(block.timestamp + 1 seconds); // periodFinish still 0
        uint duration = 7 days;
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(alice);
        lpStaking.setRewardsDuration(duration);
    }

    function testSetRewardDurationShouldFailPeriodNotFinished() public {
        // set periodFinish
        rewardToken.transfer(address(lpStaking), 1000);
        lpStaking.notifyRewardAmount(1000);

        uint duration = 7 days;
        uint blockTimestamp = block.timestamp;
        periodFinish = lpStaking.periodFinish();
        // must revert block.timestamp equals periodFinish
        assertEq(blockTimestamp + duration, periodFinish);
        vm.expectRevert("Previous rewards period must be complete before changing the duration for the new period");
        lpStaking.setRewardsDuration(duration);
    }

    function testWithdrawAmountZero(uint amount) public {
        vm.assume(amount > 0 && amount <= stakeToken.balanceOf(address(this)));
        _approveAndStake(amount);
        _assertBalances(amount);

        vm.expectRevert("Cannot withdraw 0");
        lpStaking.withdraw(0);
    }

    function testWithdrawWithdrawMoreThanStaked(uint amount) public {
        uint accountBalance = stakeToken.balanceOf(address(this));
        vm.assume(amount > 0 && amount <= accountBalance - 1);
        _approveAndStake(amount);
        _assertBalances(amount);

        vm.expectRevert("Cannot withdraw more than staked");
        lpStaking.withdraw(amount + 1);
    }

    function testWithdraw() public {
        uint accountBalanceBeforeStake = stakeToken.balanceOf(address(this));
        uint amount = 1000;
        _approveAndStake(amount);
        _assertBalances(amount);

        uint balanceAfterStake = stakeToken.balanceOf(address(this));
        assertEq(balanceAfterStake, accountBalanceBeforeStake - amount);

        lpStaking.withdraw(amount);

        uint balanceAfterExit = stakeToken.balanceOf(address(this));
        assertEq(balanceAfterExit, accountBalanceBeforeStake);
    }

    function testSetRewardDuration() public {
        uint duration = 7 days;
        lpStaking.setRewardsDuration(duration);
    }

    function _approveAndStake(uint amount) private {
        stakeToken.approve(address(lpStaking), amount);
        lpStaking.stake(amount);
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
}
