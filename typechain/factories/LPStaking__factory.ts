/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { LPStaking, LPStakingInterface } from "../LPStaking";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_rewardsToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_stakingToken",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Recovered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
    ],
    name: "RewardAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
    ],
    name: "RewardPaid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "newDuration",
        type: "uint256",
      },
    ],
    name: "RewardsDurationUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Staked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "earned",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "exit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getRewardForDuration",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastTimeRewardApplicable",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastUpdateTime",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
    ],
    name: "notifyRewardAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "periodFinish",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
      },
    ],
    name: "recoverERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardPerToken",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardPerTokenStored",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardRate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "rewards",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardsDuration",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardsToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_rewardsDuration",
        type: "uint256",
      },
    ],
    name: "setRewardsDuration",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "stakingToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "userRewardPerTokenPaid",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040526000600455600060055562093a806006553480156200002257600080fd5b50604051620027db380380620027db833981810160405281019062000048919062000232565b60016000819055506200007062000064620000fa60201b60201c565b6200010260201b60201c565b81600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555080600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550505062000279565b600033905090565b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905081600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000620001fa82620001cd565b9050919050565b6200020c81620001ed565b81146200021857600080fd5b50565b6000815190506200022c8162000201565b92915050565b600080604083850312156200024c576200024b620001c8565b5b60006200025c858286016200021b565b92505060206200026f858286016200021b565b9150509250929050565b61255280620002896000396000f3fe608060405234801561001057600080fd5b50600436106101725760003560e01c806380faa57d116100de578063cc1a378f11610097578063df136d6511610071578063df136d6514610403578063e9fad8ee14610421578063ebe2b12b1461042b578063f2fde38b1461044957610172565b8063cc1a378f146103ab578063cd3daf9d146103c7578063d1af0c7d146103e557610172565b806380faa57d146102e95780638980f11f146103075780638b876347146103235780638da5cb5b14610353578063a694fc3a14610371578063c8f33c911461038d57610172565b80633c6b16ab116101305780633c6b16ab1461024d5780633d18b9121461026957806370a0823114610273578063715018a6146102a357806372f702f3146102ad5780637b0a47ee146102cb57610172565b80628cc262146101775780630700037d146101a757806318160ddd146101d75780631c1f78eb146101f55780632e1a7d4d14610213578063386a95251461022f575b600080fd5b610191600480360381019061018c9190611c0e565b610465565b60405161019e9190611c54565b60405180910390f35b6101c160048036038101906101bc9190611c0e565b610567565b6040516101ce9190611c54565b60405180910390f35b6101df61057f565b6040516101ec9190611c54565b60405180910390f35b6101fd610589565b60405161020a9190611c54565b60405180910390f35b61022d60048036038101906102289190611c9b565b6105a0565b005b610237610971565b6040516102449190611c54565b60405180910390f35b61026760048036038101906102629190611c9b565b610977565b005b610271610c7f565b005b61028d60048036038101906102889190611c0e565b610f57565b60405161029a9190611c54565b60405180910390f35b6102ab610fa0565b005b6102b5611028565b6040516102c29190611d27565b60405180910390f35b6102d361104e565b6040516102e09190611c54565b60405180910390f35b6102f1611054565b6040516102fe9190611c54565b60405180910390f35b610321600480360381019061031c9190611d42565b61106e565b005b61033d60048036038101906103389190611c0e565b611248565b60405161034a9190611c54565b60405180910390f35b61035b611260565b6040516103689190611d91565b60405180910390f35b61038b60048036038101906103869190611c9b565b61128a565b005b610395611663565b6040516103a29190611c54565b60405180910390f35b6103c560048036038101906103c09190611c9b565b611669565b005b6103cf611762565b6040516103dc9190611c54565b60405180910390f35b6103ed6117cc565b6040516103fa9190611d27565b60405180910390f35b61040b6117f2565b6040516104189190611c54565b60405180910390f35b6104296117f8565b005b610433611849565b6040516104409190611c54565b60405180910390f35b610463600480360381019061045e9190611c0e565b61184f565b005b6000600a60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054670de0b6b3a7640000600960008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546104f8611762565b6105029190611ddb565b600c60008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461054c9190611e0f565b6105569190611e80565b6105609190611eb1565b9050919050565b600a6020528060005260406000206000915090505481565b6000600b54905090565b600060065460055461059b9190611e0f565b905090565b6002600054036105e5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105dc90611f42565b60405180910390fd5b60026000819055506105f5611946565b6105fd611762565b60088190555061060b611054565b600781905550600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146106d85761064e81610465565b600a60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600854600960008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b6000821161071b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161071290611fae565b60405180910390fd5b81600c6000610728611946565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205410156107a4576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161079b9061201a565b60405180910390fd5b81600b60008282546107b69190611ddb565b9250508190555081600c60006107ca611946565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546108139190611ddb565b92505081905550600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a9059cbb610860611946565b846040518363ffffffff1660e01b815260040161087e92919061203a565b6020604051808303816000875af115801561089d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108c1919061209b565b506000600a60006108d0611946565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054111561091a5761091961194e565b5b81610923611946565b73ffffffffffffffffffffffffffffffffffffffff167f7084f5476618d8e60b11ef0d7d3f06914655adb8793e28ff7f018d4c76d505d560405160405180910390a350600160008190555050565b60065481565b61097f611946565b73ffffffffffffffffffffffffffffffffffffffff1661099d611260565b73ffffffffffffffffffffffffffffffffffffffff16146109f3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109ea90612114565b60405180910390fd5b60006109fd611762565b600881905550610a0b611054565b600781905550600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610ad857610a4e81610465565b600a60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600854600960008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b6004544210610afa5760065482610aef9190611e80565b600581905550610b40565b600042600454610b0a9190611ddb565b9050600060055482610b1c9190611e0f565b90506006548185610b2d9190611eb1565b610b379190611e80565b60058190555050505b6000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401610b9d9190611d91565b602060405180830381865afa158015610bba573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610bde9190612149565b905060065481610bee9190611e80565b6005541115610c32576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c29906121c2565b60405180910390fd5b4260078190555060065442610c479190611eb1565b600481905550827fde88a922e0d3b88b24e9623efeb464919c6bf9f66857a65e2bfcf2ce87a9433d60405160405180910390a2505050565b600260005403610cc4576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610cbb90611f42565b60405180910390fd5b6002600081905550610cd4611946565b610cdc611762565b600881905550610cea611054565b600781905550600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610db757610d2d81610465565b600a60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600854600960008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b6000600a6000610dc5611946565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506000811115610f4b576000600a6000610e19611946565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a9059cbb610e9d611946565b836040518363ffffffff1660e01b8152600401610ebb92919061203a565b6020604051808303816000875af1158015610eda573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610efe919061209b565b5080610f08611946565b73ffffffffffffffffffffffffffffffffffffffff167fe2403640ba68fed3a2f88b7557551d1993f84b99bb10ff833f0cf8db0c5e048660405160405180910390a35b50506001600081905550565b6000600c60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b610fa8611946565b73ffffffffffffffffffffffffffffffffffffffff16610fc6611260565b73ffffffffffffffffffffffffffffffffffffffff161461101c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161101390612114565b60405180910390fd5b6110266000611ae5565b565b600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60055481565b6000600454421061106757600454611069565b425b905090565b611076611946565b73ffffffffffffffffffffffffffffffffffffffff16611094611260565b73ffffffffffffffffffffffffffffffffffffffff16146110ea576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016110e190612114565b60405180910390fd5b600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361117a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161117190612254565b60405180910390fd5b8173ffffffffffffffffffffffffffffffffffffffff1663a9059cbb61119e611260565b836040518363ffffffff1660e01b81526004016111bc92919061203a565b6020604051808303816000875af11580156111db573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111ff919061209b565b50808273ffffffffffffffffffffffffffffffffffffffff167f8c1256b8896378cd5044f80c202f9772b9d77dc85c8a6eb51967210b09bfaa2860405160405180910390a35050565b60096020528060005260406000206000915090505481565b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6002600054036112cf576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016112c690611f42565b60405180910390fd5b60026000819055506112df611946565b6112e7611762565b6008819055506112f5611054565b600781905550600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146113c25761133881610465565b600a60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600854600960008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b60008211611405576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016113fc906122c0565b60405180910390fd5b81600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e61144c611946565b306040518363ffffffff1660e01b815260040161146a9291906122e0565b602060405180830381865afa158015611487573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114ab9190612149565b10156114ec576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016114e39061237b565b60405180910390fd5b81600b60008282546114fe9190611eb1565b9250508190555081600c6000611512611946565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461155b9190611eb1565b92505081905550600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166323b872dd6115a8611946565b30856040518463ffffffff1660e01b81526004016115c89392919061239b565b6020604051808303816000875af11580156115e7573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061160b919061209b565b5081611615611946565b73ffffffffffffffffffffffffffffffffffffffff167f9e71bc8eea02a63969f509818f2dafb9254532904319f9dbda79b67bd34a5f3d60405160405180910390a350600160008190555050565b60075481565b611671611946565b73ffffffffffffffffffffffffffffffffffffffff1661168f611260565b73ffffffffffffffffffffffffffffffffffffffff16146116e5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016116dc90612114565b60405180910390fd5b6004544211611729576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016117209061246a565b60405180910390fd5b806006819055506006547ffb46ca5a5e06d4540d6387b930a7c978bce0db5f449ec6b3f5d07c6e1d44f2d360405160405180910390a250565b600080600b54036117775760085490506117c9565b600b54670de0b6b3a7640000600554600754611791611054565b61179b9190611ddb565b6117a59190611e0f565b6117af9190611e0f565b6117b99190611e80565b6008546117c69190611eb1565b90505b90565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60085481565b611847600c6000611807611946565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546105a0565b565b60045481565b611857611946565b73ffffffffffffffffffffffffffffffffffffffff16611875611260565b73ffffffffffffffffffffffffffffffffffffffff16146118cb576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016118c290612114565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361193a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611931906124fc565b60405180910390fd5b61194381611ae5565b50565b600033905090565b6000600a600061195c611946565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506000811115611ae2576000600a60006119b0611946565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a9059cbb611a34611946565b836040518363ffffffff1660e01b8152600401611a5292919061203a565b6020604051808303816000875af1158015611a71573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611a95919061209b565b5080611a9f611946565b73ffffffffffffffffffffffffffffffffffffffff167fe2403640ba68fed3a2f88b7557551d1993f84b99bb10ff833f0cf8db0c5e048660405160405180910390a35b50565b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905081600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000611bdb82611bb0565b9050919050565b611beb81611bd0565b8114611bf657600080fd5b50565b600081359050611c0881611be2565b92915050565b600060208284031215611c2457611c23611bab565b5b6000611c3284828501611bf9565b91505092915050565b6000819050919050565b611c4e81611c3b565b82525050565b6000602082019050611c696000830184611c45565b92915050565b611c7881611c3b565b8114611c8357600080fd5b50565b600081359050611c9581611c6f565b92915050565b600060208284031215611cb157611cb0611bab565b5b6000611cbf84828501611c86565b91505092915050565b6000819050919050565b6000611ced611ce8611ce384611bb0565b611cc8565b611bb0565b9050919050565b6000611cff82611cd2565b9050919050565b6000611d1182611cf4565b9050919050565b611d2181611d06565b82525050565b6000602082019050611d3c6000830184611d18565b92915050565b60008060408385031215611d5957611d58611bab565b5b6000611d6785828601611bf9565b9250506020611d7885828601611c86565b9150509250929050565b611d8b81611bd0565b82525050565b6000602082019050611da66000830184611d82565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000611de682611c3b565b9150611df183611c3b565b9250828203905081811115611e0957611e08611dac565b5b92915050565b6000611e1a82611c3b565b9150611e2583611c3b565b9250828202611e3381611c3b565b91508282048414831517611e4a57611e49611dac565b5b5092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b6000611e8b82611c3b565b9150611e9683611c3b565b925082611ea657611ea5611e51565b5b828204905092915050565b6000611ebc82611c3b565b9150611ec783611c3b565b9250828201905080821115611edf57611ede611dac565b5b92915050565b600082825260208201905092915050565b7f5265656e7472616e637947756172643a207265656e7472616e742063616c6c00600082015250565b6000611f2c601f83611ee5565b9150611f3782611ef6565b602082019050919050565b60006020820190508181036000830152611f5b81611f1f565b9050919050565b7f43616e6e6f742077697468647261772030000000000000000000000000000000600082015250565b6000611f98601183611ee5565b9150611fa382611f62565b602082019050919050565b60006020820190508181036000830152611fc781611f8b565b9050919050565b7f43616e6e6f74207769746864726177206d6f7265207468616e207374616b6564600082015250565b6000612004602083611ee5565b915061200f82611fce565b602082019050919050565b6000602082019050818103600083015261203381611ff7565b9050919050565b600060408201905061204f6000830185611d82565b61205c6020830184611c45565b9392505050565b60008115159050919050565b61207881612063565b811461208357600080fd5b50565b6000815190506120958161206f565b92915050565b6000602082840312156120b1576120b0611bab565b5b60006120bf84828501612086565b91505092915050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b60006120fe602083611ee5565b9150612109826120c8565b602082019050919050565b6000602082019050818103600083015261212d816120f1565b9050919050565b60008151905061214381611c6f565b92915050565b60006020828403121561215f5761215e611bab565b5b600061216d84828501612134565b91505092915050565b7f50726f76696465642072657761726420746f6f20686967680000000000000000600082015250565b60006121ac601883611ee5565b91506121b782612176565b602082019050919050565b600060208201905081810360008301526121db8161219f565b9050919050565b7f43616e6e6f7420776974686472617720746865207374616b696e6720746f6b6560008201527f6e00000000000000000000000000000000000000000000000000000000000000602082015250565b600061223e602183611ee5565b9150612249826121e2565b604082019050919050565b6000602082019050818103600083015261226d81612231565b9050919050565b7f43616e6e6f74207374616b652030000000000000000000000000000000000000600082015250565b60006122aa600e83611ee5565b91506122b582612274565b602082019050919050565b600060208201905081810360008301526122d98161229d565b9050919050565b60006040820190506122f56000830185611d82565b6123026020830184611d82565b9392505050565b7f5472616e73666572206f6620746f6b656e20686173206e6f74206265656e206160008201527f7070726f76656400000000000000000000000000000000000000000000000000602082015250565b6000612365602783611ee5565b915061237082612309565b604082019050919050565b6000602082019050818103600083015261239481612358565b9050919050565b60006060820190506123b06000830186611d82565b6123bd6020830185611d82565b6123ca6040830184611c45565b949350505050565b7f50726576696f7573207265776172647320706572696f64206d7573742062652060008201527f636f6d706c657465206265666f7265206368616e67696e67207468652064757260208201527f6174696f6e20666f7220746865206e657720706572696f640000000000000000604082015250565b6000612454605883611ee5565b915061245f826123d2565b606082019050919050565b6000602082019050818103600083015261248381612447565b9050919050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b60006124e6602683611ee5565b91506124f18261248a565b604082019050919050565b60006020820190508181036000830152612515816124d9565b905091905056fea264697066735822122046894349794ea8ad71b9ae5df24cf8ff854956a602af7f74b3d156320960213164736f6c63430008110033";

export class LPStaking__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    _rewardsToken: string,
    _stakingToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<LPStaking> {
    return super.deploy(
      _rewardsToken,
      _stakingToken,
      overrides || {}
    ) as Promise<LPStaking>;
  }
  getDeployTransaction(
    _rewardsToken: string,
    _stakingToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _rewardsToken,
      _stakingToken,
      overrides || {}
    );
  }
  attach(address: string): LPStaking {
    return super.attach(address) as LPStaking;
  }
  connect(signer: Signer): LPStaking__factory {
    return super.connect(signer) as LPStaking__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): LPStakingInterface {
    return new utils.Interface(_abi) as LPStakingInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): LPStaking {
    return new Contract(address, _abi, signerOrProvider) as LPStaking;
  }
}