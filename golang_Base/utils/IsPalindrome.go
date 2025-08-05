package utils

import (
	// "fmt"
	// "reflect"
	"strconv"
)


func IsPalindrome(x int) bool {
    // len是否为奇数
    strInt := strconv.Itoa(x)
    // fmt.Println(reflect.TypeOf(strInt))
    intLen := len(strInt)
    if intLen % 2 == 0 {
        return false
    } else {
        ruinArr := []rune(strInt)
        // fmt.Println(ruinArr)
        for idx,val := range ruinArr {
            if val != ruinArr[intLen-idx-1] {
                return false
            }
        }
        return true
    }
}