/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { MurkyBase, MurkyBaseInterface } from "../MurkyBase";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "data",
        type: "bytes32[]",
      },
      {
        internalType: "uint256",
        name: "node",
        type: "uint256",
      },
    ],
    name: "getProof",
    outputs: [
      {
        internalType: "bytes32[]",
        name: "",
        type: "bytes32[]",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "data",
        type: "bytes32[]",
      },
    ],
    name: "getRoot",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "left",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "right",
        type: "bytes32",
      },
    ],
    name: "hashLeafPairs",
    outputs: [
      {
        internalType: "bytes32",
        name: "_hash",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "x",
        type: "uint256",
      },
    ],
    name: "log2ceil",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "x",
        type: "uint256",
      },
    ],
    name: "log2ceilBitMagic",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "root",
        type: "bytes32",
      },
      {
        internalType: "bytes32[]",
        name: "proof",
        type: "bytes32[]",
      },
      {
        internalType: "bytes32",
        name: "valueToProve",
        type: "bytes32",
      },
    ],
    name: "verifyProof",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

export class MurkyBase__factory {
  static readonly abi = _abi;
  static createInterface(): MurkyBaseInterface {
    return new utils.Interface(_abi) as MurkyBaseInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MurkyBase {
    return new Contract(address, _abi, signerOrProvider) as MurkyBase;
  }
}
