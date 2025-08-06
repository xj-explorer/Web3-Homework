package utils

// import (
// 	"fmt"
// )

func LongestCommonPrefix(strs []string) string {
    var minLen int
    commonList := make([]string, len(strs))
    for index,_ := range strs {
        if index < len(strs)-1 {
            minLen = MinInt(len(strs[index]),len(strs[index+1]))
        }
    }
    // fmt.Println(minLen)
    for i := 0; i < minLen; i++ {
        for innerIndex,val := range strs {
            commonList[innerIndex] += string(val[i])
        }
        for index,_ := range commonList {
            if index < len(commonList)-1 {
                if commonList[index] != commonList[index+1] {
                    return commonList[index][0:i]
                }
            }
        }
    }
    return ""
}
