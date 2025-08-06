package utils

import (
	"strconv"
)

func PlusOne(digits []int) []int {
    digit := arrToInt(digits)
    // fmt.Println(digit)
    result := intToArr(digit+1)
    return result
}

func arrToInt(arr []int) int {
    var str string = ""
    for _, num := range arr {
        str += strconv.Itoa(num)
    }
    res, _ := strconv.Atoi(str)
    return res
}

func intToArr(num int) []int {
    str := strconv.Itoa(num)
    arr := make([]int, len(str))
    for index,val := range str {
        itemNum,_ := strconv.Atoi(string(val))
        arr[index] = itemNum
    }
    return arr
}