package main

import (
	"fmt"
	// "github.com/xj-explorer/Web3-Homework/golang_Base/utils"
	. "github.com/xj-explorer/Web3-Homework/golang_Base/utils"

)

func init() {
	fmt.Println("---init---")
}

func main() {
	// singleNumberResult := utils.SingleNumber([]int{2, 2, 4, 1, 4})
	singleNumberResult := SingleNumber([]int{2, 2, 4, 1, 4})
	fmt.Println("只出现一次的数字：")
	fmt.Println("[2, 2, 4, 1, 4]: ",singleNumberResult)
	fmt.Println("=====================================")


	isPalindromeResult1 := IsPalindrome(1234321)
	isPalindromeResult2 := IsPalindrome(12345)
	fmt.Println("回文数校验：")
	fmt.Println("1234321 ",isPalindromeResult1)
	fmt.Println("12345: ",isPalindromeResult2)
	fmt.Println("=====================================")


	isStrValidResult1 := IsStrValid("[()]")
	isStrValidResult2 := IsStrValid("[(])")
	isStrValidResult3 := IsStrValid("()[]{}")
	fmt.Println("有效括号字符: ")
	fmt.Println("[()]: ",isStrValidResult1)
	fmt.Println("[(]): ",isStrValidResult2)
	fmt.Println("()[]{}: ",isStrValidResult3)
	fmt.Println("=====================================")

}
