// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BinarySearch {
    
    function search(uint256[] memory arr,uint256 target) public pure returns(uint256) {
        uint256 left = 0;
        uint256 right = arr.length - 1;
        uint256 mid;
        while (left <= right) {
            mid = (left + right) / 2;
            if (arr[mid] == target) {
                return mid;
            } else if (arr[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return arr.length;
    }
}