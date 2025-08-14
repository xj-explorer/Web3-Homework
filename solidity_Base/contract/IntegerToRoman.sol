// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IntegerToRoman {

    // 定义罗马数字对应的整数值和符号
    uint256[] private romanValues = [
        1000, 900, 500, 400,
        100, 90, 50, 40,
        10, 9, 5, 4,
        1
    ];
    
    string[] private romanSymbols = [
        "M", "CM", "D", "CD",
        "C", "XC", "L", "XL",
        "X", "IX", "V", "IV",
        "I"
    ];

    function IToR(uint256 input) public view returns(string memory) {
        require(input > 0 && input <=3999, "Number must be between 1 and 3999"); 

        string memory result = "";
        for(uint256 i=0; i<romanValues.length; i++) {
            while(romanValues[i] <= input) {
                result = string(abi.encodePacked(result, romanSymbols[i]));
                input -= romanValues[i];
            }
        }
        return result;
    } 
}