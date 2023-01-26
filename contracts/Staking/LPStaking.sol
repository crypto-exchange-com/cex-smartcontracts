// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LPStaking is ReentrancyGuard, Ownable {
    IERC20 public rewardsToken;
    IERC20 public stakingToken;
    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public rewardsDuration = 7 days;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    event RewardAdded(uint256 indexed reward);
    event Staked(address indexed user, uint256 indexed amount);
    event Withdrawn(address indexed user, uint256 indexed amount);
    event RewardPaid(address indexed user, uint256 indexed reward);
    event RewardsDurationUpdated(uint256 indexed newDuration);
    event Recovered(address indexed token, uint256 indexed amount);

    constructor(address _rewardsToken, address _stakingToken){
        rewardsToken = IERC20(_rewardsToken);
        stakingToken = IERC20(_stakingToken);
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
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + ((((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate) * 1e18) / _totalSupply);
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
    function getRewardForDuration() external view returns (uint256) {
        return rewardRate * rewardsDuration;
    }

    /**
    * @notice get totalSupply of staked tokens
    */
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
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
        _totalSupply -= amount;
        _balances[_msgSender()] -= amount;
        stakingToken.transfer(_msgSender(), amount);

        if (rewards[_msgSender()] > 0)
            _getReward();
        emit Withdrawn(_msgSender(), amount);
    }

    /**
    * @dev Stake tokens to the contract
    * @param amount the amount to withdraw
    */
    function stake(uint256 amount) external nonReentrant updateReward(_msgSender()) {
        require(amount > 0, "Cannot stake 0");
        require(stakingToken.allowance(_msgSender(), address(this)) >= amount , "Transfer of token has not been approved");
        _totalSupply += amount;
        _balances[_msgSender()] += amount;
        stakingToken.transferFrom(_msgSender(), address(this), amount);
        emit Staked(_msgSender(), amount);
    }

    /**
    * @dev Get reward for caller
    */
    function getReward() external nonReentrant updateReward(_msgSender()) {
        uint256 reward = rewards[_msgSender()];
        if (reward > 0) {
            rewards[_msgSender()] = 0;
            rewardsToken.transfer(_msgSender(), reward);
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
        uint balance = rewardsToken.balanceOf(address(this));
        require(rewardRate <= balance / rewardsDuration, "Provided reward too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward);
    }

    /**
    * @dev Recover any ERC20 tokens sent to this contract
    * @param tokenAddress token address
    * @param tokenAmount the amount of tokens
    */
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
        require(tokenAddress != address(stakingToken), "Cannot withdraw the staking token");
        IERC20(tokenAddress).transfer(owner(), tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
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
    * @dev internal function called in withdraw
    * @notice When user withdraws, transfer the reward to the user
    */
    function _getReward() internal {
        uint256 reward = rewards[_msgSender()];
        if (reward > 0) {
            rewards[_msgSender()] = 0;
            rewardsToken.transfer(_msgSender(), reward);
            emit RewardPaid(_msgSender(), reward);
        }
    }
}