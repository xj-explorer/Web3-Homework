package utils

// import "fmt"

func IsStrValid(s string) bool {
    if len(s)%2 != 0 { return false }
    matchMap := map[rune]rune {
        rune('('): rune(')'),
        rune('['): rune(']'),
        rune('{'): rune('}'),
    }
    // fmt.Println(matchMap)
    runes := []rune(s)
    totalLength := len(runes)
    for i := 0; i < len(runes); i++ {
        if i < len(runes)-1 {
            value,isExist := matchMap[runes[i]]
            if isExist {
                if runes[i+1] == value || runes[len(runes)-i-1] == value {
                    totalLength -= 2
                    // fmt.Println(totalLength)
                }
            }
        }
    }
    return totalLength == 0
}