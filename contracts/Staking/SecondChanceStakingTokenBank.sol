// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Helpers/IERC20Extended.sol";
import "../models/StakeEntry.sol";

contract SecondChanceStakingTokenBank is ReentrancyGuard, Ownable {
    event Staked(uint256 indexed _id, uint256 indexed _timestamp, uint256 _windowStartDate, uint256 _windowEndDate, uint256 _poolEndDate, address _staker, address _token, uint256 _amount, uint256 _decimals);
    event UnStaked(uint256 indexed _id, uint256 indexed _timestamp);
    
    mapping(uint256 => StakeEntry) public StakeEntries;
    mapping(address => uint256[]) public StakeEntryIds;

    uint256 public LastId;
    uint256 public PoolEndDate;
    uint256 public BaseFee;
    uint256 public PenaltyFee;

    uint256 public WindowStart;
    uint256 public WindowEnd;

    constructor(uint256 endDate, uint256 windowStart, uint256 windowEnd, uint256 baseFee, uint256 penaltyFee) {
        PoolEndDate = endDate;
        BaseFee = baseFee;
        PenaltyFee = penaltyFee;
        WindowStart = windowStart;
        WindowEnd = windowEnd;
    }

    function stakeEntryIdsFullMapping(address _address) external view returns (uint256[] memory) {
        return StakeEntryIds[_address];
    }

    /**
    * @dev function to stake the given token (amount = all msgSender has)
    * @param stakingTokenAddress the token to stake
    */ 
    function stake(address stakingTokenAddress) external nonReentrant {
        uint balanceOf = IERC20(stakingTokenAddress).balanceOf(_msgSender());       
        require(IERC20(stakingTokenAddress).allowance(_msgSender(), address(this)) >= balanceOf, "Allowance not set");
        require(block.timestamp > WindowStart, "Cannot stake before start");
        require(block.timestamp < WindowEnd, "Cannot stake after end");

        LastId += 1;
        StakeEntries[LastId].Staker = _msgSender();
        StakeEntries[LastId].TokenAddress = stakingTokenAddress;        
        StakeEntries[LastId].State = State.STAKED;
        StakeEntries[LastId].EntryTime = block.timestamp;
        StakeEntries[LastId].PeriodFinish = PoolEndDate;

        StakeEntryIds[_msgSender()].push(LastId);
        uint256 balanceOfContractBefore = IERC20(stakingTokenAddress).balanceOf(address(this));
        IERC20(stakingTokenAddress).transferFrom(_msgSender(), address(this), balanceOf);
        uint256 balanceOfContractAfter = IERC20(stakingTokenAddress).balanceOf(address(this));
        uint256 actualTransfer = balanceOfContractAfter - balanceOfContractBefore;
        
        StakeEntries[LastId].Amount = actualTransfer;
        emit Staked(LastId, block.timestamp, WindowStart, WindowEnd, PoolEndDate, _msgSender(), stakingTokenAddress, actualTransfer, IERC20Extended(stakingTokenAddress).decimals());
    }

    /**
    * @dev function to unStake the given token
    * @param id the id of the entry to unstake
    */ 
    function unStake(uint256 id) external nonReentrant {
        require(StakeEntries[id].Staker == _msgSender(), "not allowed to unstake this entry");
        require(StakeEntries[id].State == State.STAKED, "already unstaked");

        uint256 fee = (StakeEntries[id].Amount * BaseFee) / 100;
        if(block.timestamp < StakeEntries[LastId].PeriodFinish) fee = (StakeEntries[id].Amount * PenaltyFee) / 100;

        uint256 amount = StakeEntries[id].Amount - fee;
        StakeEntries[id].State = State.UNSTAKED;

        IERC20(StakeEntries[id].TokenAddress).transfer(_msgSender(), amount);
        IERC20(StakeEntries[id].TokenAddress).transfer(owner(), fee);
        emit UnStaked(id, block.timestamp);
    }

    /**
    * @dev function to set the pool end date
    * @param endDate the end date to set
    */
    function setPoolEndDate(uint256 endDate) external onlyOwner {
        PoolEndDate = endDate;
    }

    /**
    * @dev function to set the window start
    * @param startDate the start date to set
    */
    function setWindowStart(uint256 startDate) external onlyOwner {
        WindowStart = startDate;
    }

    /**
    * @dev function to set the window end
    * @param endDate the end date to set
    */
    function setWindowEnd(uint256 endDate) external onlyOwner {
        WindowEnd = endDate;
    }

    /**
    * @dev function to set the base fee
    * @param baseFee the base fee to set
    */
    function setBaseFee(uint256 baseFee) external onlyOwner {
        BaseFee = baseFee;
    }

    /**
    * @dev function to set the penalty fee
    * @param penaltyFee the penalty fee to set
    */
    function setPenaltyFee(uint256 penaltyFee) external onlyOwner {
        PenaltyFee = penaltyFee;
    }
}