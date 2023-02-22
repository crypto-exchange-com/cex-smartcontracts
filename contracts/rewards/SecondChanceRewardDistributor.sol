// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract SecondChanceRewardDistributor is ReentrancyGuard, Ownable {
    bytes32 public merkleRoot = "";
    IERC20 public RewardToken;
    uint public ReleaseDate;
    
    mapping(address => uint) public RewardAmountClaimed;
    event RewardWithdraw(address reciever, uint256 amount);

    constructor(address token) {
        RewardToken = IERC20(token);
    }

    /**
    * @dev function to withdraw rewards currently available
    * @notice Amount is total amount available for withdraw, has to be posted because of merkle proof, function will distribute phased
    * @param amount the total amount of rewards that will be available (used for merkle proofing)
    * @param _merkleProof the merkle proof
    */
    function withdraw(uint amount, bytes32[] calldata _merkleProof) external nonReentrant {
        require(RewardToken.balanceOf(address(this)) >= amount, "Not enough funds left");
        require(merkleRoot != "", "merkle root not set");
        bytes32 leaf = keccak256(abi.encodePacked(_msgSender(), amount));        
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Incorrect proof");
        require(RewardAmountClaimed[_msgSender()] < amount, "Total amount already claimed");
        require(ReleaseDate != 0 && ReleaseDate < block.timestamp, "Release has not started yet!");
        uint256 elapsed = block.timestamp - ReleaseDate;
        uint256 releaseTimes = elapsed / (30 * 1 days);
        uint256 toRelease = 0;
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

        // when toRelease is 1, the user has not reached the first phase yet
        toRelease -= RewardAmountClaimed[_msgSender()];

        if (toRelease > 0 && toRelease <= amount) {
            RewardAmountClaimed[_msgSender()] += toRelease;
            RewardToken.transfer(_msgSender(), toRelease);
            emit RewardWithdraw(_msgSender(), toRelease);
        }
    }

    /**
    * @dev function to set the merkle root
    * @param root the merkle tree root to set
    */
    function setMerkleRoot(bytes32 root) external onlyOwner {
        merkleRoot = root;
    }

    /**
    * @dev function to set release date of the rewards
    * @param releaseDate the release date of the rewards
    */
    function setReleaseDate(uint releaseDate) external onlyOwner {
        require(releaseDate > block.timestamp, "Release date has to be in the future");
        ReleaseDate = releaseDate;
    }
}