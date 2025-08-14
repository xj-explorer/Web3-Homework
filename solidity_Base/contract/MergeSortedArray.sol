// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MergeSortedArray {

    function merge(uint256[] memory array1, uint256[] memory array2) public pure returns (uint256[] memory) {
        require(array1.length > 0, "Array1 should not be empty");
        require(array2.length > 0, "Array2 should not be empty");
        uint length1 = array1.length;
        uint length2 = array2.length;
        // 检查数组是否已排序
        for(uint256 i = 0; i < length1 - 1; i++) {
            require(array1[i] <= array1[i+1], "Array1 should be sorted");
        }
        for(uint256 i = 0; i < length2 - 1; i++) {
            require(array2[i] <= array2[i+1], "Array2 should be sorted");
        }     
        uint256[] memory result = new uint256[](array1.length + array2.length);
        uint256 i1 = 0; // array1的索引
        uint256 j2 = 0; // array2的索引
        uint256 k = 0; // result的索引
        while (i1 < length1 && j2 < length2) {
            if (array1[i1] <= array2[j2]) {
                result[k] = array1[i1];
                i1++;
            } else {
                result[k] = array2[j2];
                j2++;
            }
            k++;
        }
        while (i1 < length1) {
            result[k] = array1[i1];
            i1++;
            k++;
        }
        while (j2 < length2) {
            result[k] = array2[j2];
            j2++;
            k++;
        }
        return result;    
    }
}