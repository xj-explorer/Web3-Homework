// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RomanToInteger {
    event LogMessage(string message, uint256 value);

    struct RomanData {
        uint256 value;
        uint256 num;
    }
    mapping(string => RomanData) public romanMap;
    string[] public allCharacters;

    constructor() {
        romanMap["M"].value = 1000;
        romanMap["D"].value = 500;
        romanMap["C"].value = 100;
        romanMap["L"].value = 50;
        romanMap["X"].value = 10;
        romanMap["V"].value = 5;
        romanMap["I"].value = 1;
        romanMap["IV"].value = 4;
        romanMap["IX"].value = 9;
        romanMap["XL"].value = 40;
        romanMap["XC"].value = 90;
        romanMap["CD"].value = 400;
        romanMap["CM"].value = 900;
        allCharacters = ["M","D","C","L","X","V","I","IV","IX","XL","XC","CD","CM"];
    }

    function RToI(string memory input) public returns(uint256) {
        for(uint i=0; i<allCharacters.length; i++) {
            romanMap[allCharacters[i]].num = 0;
        }
        bytes memory bytesInput = bytes(input);
        uint length = bytesInput.length;
        for (uint i = 0; i < length; i++) {
            if (bytesInput[i] != bytes("I")[0] &&
                bytesInput[i] != bytes("V")[0] &&
                bytesInput[i] != bytes("X")[0] &&
                bytesInput[i] != bytes("L")[0] &&
                bytesInput[i] != bytes("C")[0] &&
                bytesInput[i] != bytes("D")[0] &&
                bytesInput[i] != bytes("M")[0]) {
                revert("Invalid Roman Character");
            }
        }
        for (uint i = 0; i < length; i++) {
            if (i < length - 1) {
                if (bytesInput[i] == bytes("C")[0] && bytesInput[i+1] == bytes("M")[0]) {
                    romanMap["CM"].num++;
                    i++;
                    continue;                    
                } else if (bytesInput[i] == bytes("C")[0] && bytesInput[i+1] == bytes("D")[0]) {
                    romanMap["CD"].num++;
                    i++;
                    continue;
                } else if(bytesInput[i] == bytes("X")[0] && bytesInput[i+1] == bytes("C")[0]) {
                    romanMap["XC"].num++;
                    i++;
                    continue;
                } else if(bytesInput[i] == bytes("X")[0] && bytesInput[i+1] == bytes("L")[0]) {
                    romanMap["XL"].num++;
                    i++;
                    continue;
                } else if(bytesInput[i] == bytes("I")[0] && bytesInput[i+1] == bytes("X")[0]) {
                    romanMap["IX"].num++;
                    i++;
                    continue;
                } else if(bytesInput[i] == bytes("I")[0] && bytesInput[i+1] == bytes("V")[0]) {
                    romanMap["IV"].num++;
                    i++;
                    continue;
                }
            }
            romanMap[string(abi.encodePacked(bytesInput[i]))].num++;
        }
        uint256 result = 0;
        for(uint i=0; i<allCharacters.length; i++) {
            if(romanMap[allCharacters[i]].num != 0) {
                result += romanMap[allCharacters[i]].num*romanMap[allCharacters[i]].value;
            }
        }
        emit LogMessage("transfer result =======> ", result);
        return result;
    }
}