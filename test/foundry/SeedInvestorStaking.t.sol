// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "../../contracts/Staking/SeedInvestorStaking.sol";
import "../../contracts/TestTokenTwo.sol";
import "../../contracts/TestTokenOne.sol";

// almost same as LPStaking but stake require merkleProof and rewardToken = stakeToken
// some changes in balances
contract SeedInvestorStakingTest is Test {
    SeedInvestorStaking public lpStaking;
    // rewardToken = stakeToken
    TestTokenTwo public rewardToken;
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
        stakeToken = new TestTokenTwo();
        rewardToken = stakeToken;
        recoverToken = new TestTokenTwo();
        lpStaking = new SeedInvestorStaking(address(stakeToken));
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

    function testStake(uint amount) public {
        bytes32[] memory merkleProof = new bytes32[](0);
        vm.assume(amount > 0 && amount <= stakeToken.balanceOf(address(this)));
        stakeToken.approve(address(lpStaking), amount);
        lpStaking.stake(amount, merkleProof);
        _assertBalances(amount);
    }

    function testStakeShouldFailAmountZero() public {
        bytes32[] memory merkleProof = new bytes32[](0);
        vm.expectRevert("Cannot stake 0");
        lpStaking.stake(0, merkleProof);
    }

    function testStakeShouldFailAmountNotApproved() public {
        bytes32[] memory merkleProof = new bytes32[](0);
        vm.expectRevert("Transfer of token has not been approved");
        lpStaking.stake(100, merkleProof);
    }

    function testStakeAndNotify(uint amount) public {
        uint accountBalance = stakeToken.balanceOf(address(this));
        vm.assume(amount > 0 && amount <= accountBalance / 2);
        _approveAndStake(amount);
        _assertBalances(amount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), amount);

        vm.assume(block.timestamp > lpStaking.periodFinish());
        lpStaking.notifyRewardAmount(amount);

        // verify notifyRewardAmount
        _assertNotifyRewardAmount(amount, true);
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
        _assertNotifyRewardAmount(firstAmount, true);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), secondAmount);
        vm.warp(block.timestamp + 1 days);

        periodFinish = lpStaking.periodFinish();
        assertGt(periodFinish, block.timestamp);

        lpStaking.notifyRewardAmount(secondAmount);
        uint amountToDistribute = firstAmount + firstAmount + secondAmount;
        _assertNotifyRewardAmount(amountToDistribute, false);
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
        _assertNotifyRewardAmount(firstAmount, true);
        uint lpStakingBalance = rewardToken.balanceOf(address(lpStaking));
        assertEq(lpStakingBalance, firstAmount + firstAmount);

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

        uint totalBalance = firstAmount + firstAmount + secondAmount;
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
        _assertNotifyRewardAmount(firstAmount, true);

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
        uint totalBalance = firstAmount + firstAmount + secondAmount;
        _assertNotifyRewardAmount(totalBalance, false);
    }

    function testStakeAndNotifyAmount(uint amount) public {
        uint maxAmount = stakeToken.balanceOf(address(this));
        uint dividedAmount = maxAmount / 3; // tokens are transferred two times as rewards. cannot exceed balance
        vm.assume(amount > 0 && amount <= dividedAmount);

        _approveAndStake(amount);
        _assertBalances(amount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), amount);
        lpStaking.notifyRewardAmount(amount);
        _assertNotifyRewardAmount(amount, true);

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
//        _assertNotifyRewardAmount(amount, true);
    }

    function testStakeAndNotifyAmountWithLessRewards(uint amount, uint rewards) public {
        uint accountBalance = stakeToken.balanceOf(address(this));
        vm.assume(amount > 0 && amount <= accountBalance / 2);
        vm.assume(rewards > 0 && rewards < amount);

        _approveAndStake(amount);
        _assertBalances(amount);

        // transfer reward token to lpStaking
        rewardToken.transfer(address(lpStaking), amount);
        lpStaking.notifyRewardAmount(rewards);
        _assertNotifyRewardAmount(amount, true);

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
        uint dividedAmount = maxAmount / 4; // tokens are transferred four times as rewards. cannot exceed balance
        vm.assume(amount > 0 && amount <= dividedAmount);
        vm.assume(rewards > 0 && rewards < amount);

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

        // tokens are transferred back to alice.
        uint balanceAfterExit = stakeToken.balanceOf(alice);
        assertEq(balanceAfterExit, dividedAmount + earned);
    }

    function testStakeCycleWithdraw() public {
        uint maxAmount = stakeToken.balanceOf(address(this));
        uint dividedAmount = maxAmount / 4; // tokens are transferred four times as rewards. cannot exceed balance
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

        // tokens are transferred back to alice.
        uint balanceAfterExit = stakeToken.balanceOf(alice);
        assertEq(balanceAfterExit, dividedAmount + earned);
    }

    function testStakeAndNotifyShouldFailNoOwner(uint amount) public {
        uint accountBalance = stakeToken.balanceOf(address(this));
        vm.assume(amount > 0 && amount <= accountBalance / 2);
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
        vm.expectRevert("Cannot withdraw more than rewards available");
        lpStaking.recoverERC20(address(stakeToken), amount);
    }

    function testRecoverERC20NotRewardToken() public {
        uint amount = 1000;
        recoverToken.transfer(address(lpStaking), amount);
        lpStaking.recoverERC20(address(recoverToken), amount);
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
        bytes32[] memory merkleProof = new bytes32[](0);
        lpStaking.stake(amount, merkleProof);
    }

    function _assertBalances(uint amount) private {
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
