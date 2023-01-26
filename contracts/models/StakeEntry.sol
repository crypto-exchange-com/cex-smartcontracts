// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

struct StakeEntry{
    address Staker;
    address TokenAddress;
    uint Amount;
    State State;
    uint EntryTime;
    uint PeriodFinish;
}

enum State {
    STAKED,
    UNSTAKED
}