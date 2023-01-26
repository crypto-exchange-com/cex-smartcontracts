// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CryptoExchange is ERC20, Ownable {
    // To determine decimals: rate of 1 with fraction 1000 = 0,1%
    uint256 public FeeFraction = 1000;
    address public FeeRecipient;

    mapping(address => bool) public FeeExclusions;

    constructor(address feeRecepient) ERC20("CEX Coin", "CEX") {
        FeeRecipient = feeRecepient;
        _mint(_msgSender(), 888000000 * 10 ** 18);
    }

    /**
    * @dev overrides transfer to include fees
    * @param to the address to transfer to
    * @param amount the amount to transfer    
    */
    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = _msgSender();
        
        uint256 fee = _getFeeFor(amount);
        if(FeeExclusions[owner] || FeeExclusions[to]) fee = 0;        

        if (fee > 0) {
            _transfer(owner, FeeRecipient, fee);
        }
        
        uint256 amountWithoutFee = amount - fee;
        _transfer(owner, to, amountWithoutFee);
        return true;
    }

    /**
    * @dev overrides transferFrom to include fees
    * @param from the address to transfer from
    * @param to the address to transfer to
    * @param amount the amount to transfer    
    */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        
        uint256 fee = _getFeeFor(amount);
        if(FeeExclusions[from] || FeeExclusions[to] || FeeExclusions[spender]) fee = 0;        

        if (fee > 0) {
            _transfer(from, FeeRecipient, fee);
        }

        uint256 amountWithoutFee = amount - fee;
        _transfer(from, to, amountWithoutFee);
        return true;
    }

    /**
    * @dev function to set the fee fraction
    * @param fraction the fraction to set
    */
    function setFeeFraction(uint256 fraction) onlyOwner external {
        FeeFraction = fraction;
    }

    /**
    * @dev function to set the fee recipient address
    * @param feeRecipient the new recipient address
    */
    function setFeeRecipient(address feeRecipient) onlyOwner external {
        FeeRecipient = feeRecipient;
    }

    /**
    * @dev function to set an address for fee exclusion
    * @param toExclude the address to exclude
    */
    function addFeeExclusion(address toExclude) onlyOwner external {
        FeeExclusions[toExclude] = true;
    }

    /**
    * @dev function to remove an address from fee exclusion
    * @param toExclude the address to remove
    */
    function removeFeeExclusion(address toExclude) onlyOwner external {
        FeeExclusions[toExclude] = false;
    }

    /**
    * @dev Function to allow burning of owned tokens
    * @param amount the amount of tokens to burn
    */
    function burn(uint256 amount) external {
        uint256 fee = _getFeeFor(amount);
        if(FeeExclusions[_msgSender()]) fee = 0;
        if(fee > 0)
        {
            _transfer(_msgSender(), FeeRecipient, fee);
        }
        
        uint256 amountWithoutFee = amount - fee;
        _burn(_msgSender(), amountWithoutFee);
    }

    /**
    * @dev function to calculate fee
    * @param value the value to calculate fee on
    * @return uint256 the calculated fee
    */
    function _getFeeFor(uint256 value) internal view returns(uint256) {
        if (FeeFraction == 0) {
            return 0;
        }

        return value / FeeFraction;
    }
}