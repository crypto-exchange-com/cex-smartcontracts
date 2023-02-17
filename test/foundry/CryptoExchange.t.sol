// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "../../contracts/CryptoExchange.sol";

contract CryptoExchangeTest is Test {
    CryptoExchange public cryptoExchange;
    uint256 public FeeFraction = 1000;
    address public FeeRecipient = address(0x1234);

    address public alice = address(0x4321);
    address public bob = address(0x5678);

    function setUp() public {
        cryptoExchange = new CryptoExchange(FeeRecipient);
    }

    function testBalanceOf() public {
        uint256 balance = cryptoExchange.balanceOf(address(this));
        assertEq(balance, 888000000 * 10 ** 18);
    }

    function testFeeRecipient() public {
        address feeRecipient = cryptoExchange.FeeRecipient();
        assertEq(feeRecipient, FeeRecipient);
    }

    function testDecimal() public {
        uint8 decimals = cryptoExchange.decimals();
        assertEq(decimals, 18);
    }

    function testFeeFraction() public {
        uint256 feeFraction = cryptoExchange.FeeFraction();
        assertEq(feeFraction, FeeFraction);
    }

    function testTransfer(uint amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        // transfer tokens to alice
        cryptoExchange.transfer(alice, amount);
        // calculate fee
        uint fee = amount / FeeFraction;
        uint amountAfterFee = amount - fee;
        // check balance of alice
        assertEq(cryptoExchange.balanceOf(alice), amountAfterFee);
        // check feeRecipient balance
        assertEq(cryptoExchange.balanceOf(FeeRecipient), fee);
    }

    function testTransferShouldFailAmountZero() public {
        uint amount = 0;
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        vm.expectRevert("Amount must be greater than zero");
        cryptoExchange.transfer(alice, amount);
    }

    function testTransferWithFeeExcludedToAddress(uint amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        // add fee exclusion
        cryptoExchange.addFeeExclusion(alice);
        assertEq(cryptoExchange.FeeExclusions(alice), true);
        // transfer tokens to alice
        cryptoExchange.transfer(alice, amount);
        // check balance of alice
        assertEq(cryptoExchange.balanceOf(alice), amount);
        // check feeRecipient balance
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
    }

    function testTransferWithFeeExcludedFromAddress(uint amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        // add fee exclusion
        cryptoExchange.addFeeExclusion(address(this));
        assertEq(cryptoExchange.FeeExclusions(address(this)), true);
        // transfer tokens to alice
        cryptoExchange.transfer(alice, amount);
        // check balance of alice
        assertEq(cryptoExchange.balanceOf(alice), amount);
        // check feeRecipient balance
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
    }

    function testTransferFromShouldFailAmountZero() public {
        uint amount = 0;
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        vm.expectRevert("Amount must be greater than zero");
        cryptoExchange.transferFrom(alice, bob, amount);
    }

    function testTransferFromShouldFailNoAllowance(uint amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        vm.expectRevert("ERC20: insufficient allowance");
        cryptoExchange.transferFrom(alice, bob, amount);
    }

    function testTransferFrom(uint amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        // transfer tokens to alice
        cryptoExchange.transfer(alice, amount);
        // calculate fee
        uint fee = amount / FeeFraction;
        uint amountAfterFee = amount - fee;
        assertEq(cryptoExchange.balanceOf(FeeRecipient), fee);

        vm.prank(alice);
        cryptoExchange.approve(address(this), amountAfterFee);
        // check allowance
        uint256 allowance = cryptoExchange.allowance(alice, address(this));
        assertEq(allowance, amountAfterFee);
        cryptoExchange.transferFrom(alice, bob, amountAfterFee);
        // calculate fee
        uint secondFee = amountAfterFee / FeeFraction;
        uint secondAmountAfterFee = amountAfterFee - secondFee;
        // check balance of bob
        assertEq(cryptoExchange.balanceOf(bob), secondAmountAfterFee);
        // check feeRecipient balance
        assertEq(cryptoExchange.balanceOf(FeeRecipient), fee + secondFee);
    }

    function testTransferFromFeeExcludedFromAddress(uint amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        cryptoExchange.addFeeExclusion(address(alice));
        assertEq(cryptoExchange.FeeExclusions(address(alice)), true);

        // transfer tokens to alice
        cryptoExchange.transfer(alice, amount);
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        vm.prank(alice);
        cryptoExchange.approve(address(this), amount);
        // check allowance
        uint256 allowance = cryptoExchange.allowance(alice, address(this));
        assertEq(allowance, amount);

        cryptoExchange.transferFrom(alice, bob, amount);
        // check balance of bob
        assertEq(cryptoExchange.balanceOf(bob), amount);
        // check feeRecipient balance
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
    }

    function testTransferFromFeeExcludedFromAddAndRemoveAddress(uint amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        cryptoExchange.addFeeExclusion(address(alice));
        assertEq(cryptoExchange.FeeExclusions(address(alice)), true);
        // transfer tokens to alice
        cryptoExchange.transfer(alice, amount);
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        vm.prank(alice);
        cryptoExchange.approve(address(this), amount);
        // check allowance
        uint256 allowance = cryptoExchange.allowance(alice, address(this));
        assertEq(allowance, amount);
        // remove feeExclusion
        cryptoExchange.removeFeeExclusion(address(alice));
        cryptoExchange.transferFrom(alice, bob, amount);
        // calculate fee
        uint fee = amount / FeeFraction;
        uint amountAfterFee = amount - fee;
        // check balance of alice
        assertEq(cryptoExchange.balanceOf(bob), amountAfterFee);
        // check feeRecipient balance
        assertEq(cryptoExchange.balanceOf(FeeRecipient), fee);
    }

    function testTransferFromFeeExcludedToAddAndRemoveAddress(uint amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        cryptoExchange.addFeeExclusion(address(alice));
        assertEq(cryptoExchange.FeeExclusions(address(alice)), true);
        // transfer tokens to alice
        cryptoExchange.transfer(alice, amount);
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        vm.prank(alice);
        cryptoExchange.approve(address(this), amount);
        // check allowance
        uint256 allowance = cryptoExchange.allowance(alice, address(this));
        assertEq(allowance, amount);
        // remove feeExclusion
        cryptoExchange.removeFeeExclusion(address(alice));
        cryptoExchange.addFeeExclusion(address(bob));
        cryptoExchange.transferFrom(alice, bob, amount);
        // check balance of alice
        assertEq(cryptoExchange.balanceOf(bob), amount);
        // check feeRecipient balance
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
    }

    function testSetFeeFraction(uint256 feeFraction) public {
        vm.assume(feeFraction > 0);
        cryptoExchange.setFeeFraction(feeFraction);
        assertEq(cryptoExchange.FeeFraction(), feeFraction);
    }

    function testSetFeeFractionFactionShouldFailNoOwner(uint256 feeFraction) public {
        vm.assume(feeFraction > 0);
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        cryptoExchange.setFeeFraction(feeFraction);
    }

    function testSetFeeFractionToZeroAndTransfer(uint amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        cryptoExchange.setFeeFraction(0);
        uint256 feeFraction = cryptoExchange.FeeFraction();
        assertEq(feeFraction, 0);
        // transfer tokens to alice
        cryptoExchange.transfer(alice, amount);
        // check balance of alice
        assertEq(cryptoExchange.balanceOf(alice), amount);
        // check feeRecipient balance
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
    }

    function testSetFeeFractionToZeroAndTransferFrom(uint amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        // set fee fraction to zero
        cryptoExchange.setFeeFraction(0);
        uint256 feeFraction = cryptoExchange.FeeFraction();
        assertEq(feeFraction, 0);
        // transfer tokens to alice
        cryptoExchange.transfer(alice, amount);
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
        vm.prank(alice);
        cryptoExchange.approve(address(this), amount);
        // check allowance
        uint256 allowance = cryptoExchange.allowance(alice, address(this));
        assertEq(allowance, amount);
        // transfer from alice to bob
        cryptoExchange.transferFrom(alice, bob, amount);
        // check balance of alice
        assertEq(cryptoExchange.balanceOf(bob), amount);
        // check feeRecipient balance
        assertEq(cryptoExchange.balanceOf(FeeRecipient), 0);
    }

    function testSetFeeRecipient(address feeRecipient) public {
        vm.assume(feeRecipient != address(0));
        cryptoExchange.setFeeRecipient(feeRecipient);
        assertEq(cryptoExchange.FeeRecipient(), feeRecipient);
    }

    function testSetFeeRecipientShouldFailNotOwner(address feeRecipient) public {
        vm.assume(feeRecipient != address(0));
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        cryptoExchange.setFeeRecipient(feeRecipient);
    }

    function testSetFeeRecipientShouldFailZeroAddress() public {
        vm.expectRevert("Fee recipient cannot be zero address");
        cryptoExchange.setFeeRecipient(address(0));
    }

    function testAddFeeExclusion(address exclusion) public {
        vm.assume(exclusion != address(0));
        cryptoExchange.addFeeExclusion(exclusion);
        assertEq(cryptoExchange.FeeExclusions(exclusion), true);
    }

    function testRemoveFeeExclusion(address exclusion) public {
        vm.assume(exclusion != address(0));
        cryptoExchange.addFeeExclusion(exclusion);
        assertEq(cryptoExchange.FeeExclusions(exclusion), true);
        cryptoExchange.removeFeeExclusion(exclusion);
        assertEq(cryptoExchange.FeeExclusions(exclusion), false);
    }

    function testBurn(uint256 amount) public {
        vm.assume(amount > 0 && amount <= cryptoExchange.balanceOf(address(this)));
        cryptoExchange.burn(amount);
        assertEq(cryptoExchange.balanceOf(address(this)), 888000000 * 10 ** 18 - amount);
    }
}
