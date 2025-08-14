// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReverseString {
    function reverse(string memory input) public pure returns (string memory) {
        bytes memory bytesInput = bytes(input);
        bytes memory reversedBytes = new bytes(bytesInput.length);
        uint length = bytesInput.length;
        for (uint i = 0; i < length; i++) {
            reversedBytes[i] = bytesInput[length - 1 - i];
        }
        return string(reversedBytes);
    }
}