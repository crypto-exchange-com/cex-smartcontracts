// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestTokenTwo is ERC20, Ownable {

    /**
    * @dev Test token for testing only
    */
    constructor() ERC20("Test Two", "TestTwo") {
        _mint(_msgSender(), 888000000 * 10 ** 18);
    }
}