// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract SeedInvestorStaking is ReentrancyGuard, Ownable {
    // Reward token is the same as staking token
    IERC20 public Token;
    uint256 public periodFinish = 0;
    uint256 public totalStakers;
    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public totalReward;
    uint256 public rewardsDuration = 7 days;
    uint256 public rewardRate = 0;
    bytes32 public merkleRoot = "";

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    mapping(address => uint256) private _balances;

    event RewardAdded(uint256 indexed reward);
    event Staked(address indexed user, uint256 indexed amount);
    event Withdrawn(address indexed user, uint256 indexed amount);
    event RewardPaid(address indexed user, uint256 indexed reward);
    event RewardsDurationUpdated(uint256 indexed newDuration);
    event Recovered(address indexed token, uint256 indexed amount);

    constructor(address token){
        Token = IERC20(token);
    }

    /**
    * @dev Update reward for account
    * @param account The account to update reward for
    */
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    /**
    * @dev Calculate the reward per token
    */
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + ((((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate) * 1e18) / totalStaked);
    }

    /**
    * @dev earned rewards based on account
    * @param account the account
    */
    function earned(address account) public view returns (uint256) {
        return ((_balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 ) + rewards[account];
    }

    /**
     * @dev get rewards for the reward duration
     */
    function getRewardForDuration() public view returns (uint256) {
        return rewardRate * rewardsDuration;
    }

    /**
    * @dev get staking balance of an address
    * @param account the account
    */
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    /**
    * @dev Withdraw from the staking pool
    * @param amount the amount to withdraw
    */
    function withdraw(uint256 amount) public nonReentrant updateReward(_msgSender()) {
        require(amount > 0, "Cannot withdraw 0");
        require(_balances[_msgSender()] >= amount, "Cannot withdraw more than staked");
        totalStaked -= amount;
        if (amount == _balances[_msgSender()]) totalStakers -= 1;
        _balances[_msgSender()] -= amount;
        Token.transfer(_msgSender(), amount);

        if (rewards[_msgSender()] > 0)
            _getReward();
        emit Withdrawn(msg.sender, amount);
    }

    /**
    * @dev Stake tokens to the contract
    * @param amount the amount to withdraw
    * @param _merkleProof the merkle proof
    */
    function stake(uint256 amount, bytes32[] calldata _merkleProof) external nonReentrant updateReward(_msgSender()) {
        require(amount > 0, "Cannot stake 0");
        if (merkleRoot != "")
        {
            bytes32 leaf = keccak256(abi.encodePacked(_msgSender()));
            require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Incorrect proof");
        }
        
        require(Token.allowance(_msgSender(), address(this)) >= amount , "Transfer of token has not been approved");
        if (_balances[_msgSender()] == 0) totalStakers += 1;
        totalStaked += amount;
        _balances[_msgSender()] += amount;
        Token.transferFrom(_msgSender(), address(this), amount);
        emit Staked(_msgSender(), amount);
    }

    /**
    * @dev Get reward for caller
    */
    function getReward() external nonReentrant updateReward(_msgSender()) {
        uint256 reward = rewards[_msgSender()];
        if (reward > 0) {
            rewards[_msgSender()] = 0;
            totalReward -= reward;
            Token.transfer(_msgSender(), reward);
            emit RewardPaid(_msgSender(), reward);
        }
    }

    /**
    * @dev Exit the staking pool and claim rewards
    */
    function exit() external {
        withdraw(_balances[_msgSender()]);
    }

    /**
    * @dev Only owner function to notifyRewardAmount
    * @param reward Amount of reward to be distributed
    */
    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint balance = Token.balanceOf(address(this)) - totalStaked;
        require(rewardRate <= balance / rewardsDuration, "Provided reward too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        totalReward += reward;
        emit RewardAdded(reward);
    }

    /**
    * @dev Set the duration of the rewards period
    * @param _rewardsDuration the duration of the rewards period
    */
    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        require(
            block.timestamp > periodFinish,
            "Previous rewards period must be complete before changing the duration for the new period"
        );
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(rewardsDuration);
    }

    /**
    * @dev set Merkle root
    * @param root the merkle root
    */
    function setMerkleRoot(bytes32 root) external onlyOwner {
        merkleRoot = root;
    }

    /**
    * @dev Recover any ERC20 tokens sent to this contract
    * @param tokenAddress token address
    * @param tokenAmount the amount of tokens
    */
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
        if (tokenAddress == address(Token)) //token to retrieve is same as used for staking/rewards
        {
            require(totalReward >= tokenAmount, "Cannot withdraw more than rewards available");
            totalReward -= tokenAmount;
            Token.transfer(owner(), tokenAmount);
            emit Recovered(address(Token), tokenAmount);
        } else {
            IERC20(tokenAddress).transfer(owner(), tokenAmount);
            emit Recovered(tokenAddress, tokenAmount);
        }        
    }

    /**
    * @dev internal function called in withdraw
    * @notice When user withdraws, transfer the reward to the user
    */
    function _getReward() internal {
        uint256 reward = rewards[_msgSender()];
        if (reward > 0) {
            rewards[_msgSender()] = 0;
            Token.transfer(_msgSender(), reward);
            emit RewardPaid(_msgSender(), reward);
        }
    }
}