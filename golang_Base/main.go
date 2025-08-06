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


	prefixResult1 := LongestCommonPrefix([]string{"flower","flow","flight"})
	prefixResult2 := LongestCommonPrefix([]string{"abcwe","abcrere","abcdef"})
	prefixResult3 := LongestCommonPrefix([]string{"dog","racecar","car"})
	fmt.Println("最长公共前缀: ")
	fmt.Println("['flower','flow','flight']: ",prefixResult1)
	fmt.Println("['abcwe','abcrere','abcdef']: ",prefixResult2)
	fmt.Println("['dog','racecar','car']: ",prefixResult3)
	fmt.Println("=====================================")


	plusOneResult1 := PlusOne([]int{1,2,3})
	plusOneResult2 := PlusOne([]int{4,3,2,1})
	plusOneResult3 := PlusOne([]int{9})
	fmt.Println("加一: ")
	fmt.Println("[1 2 3]: ",plusOneResult1)
	fmt.Println("[4 3 2 1]: ",plusOneResult2)
	fmt.Println("[9]: ",plusOneResult3)
	fmt.Println("=====================================")


	removeDuplicatesResult1 := RemoveDuplicates([]int{1,1,2})
	removeDuplicatesResult2 := RemoveDuplicates([]int{0,0,1,1,1,2,2,3,3,4})
	fmt.Println("删除有序数组中的重复项: ")
	fmt.Println("[1 1 2]: ",removeDuplicatesResult1)
	fmt.Println("[0 0 1 1 1 2 2 3 3 4]: ",removeDuplicatesResult2)
	fmt.Println("=====================================")


	mergeResult1 := Merge([][]int{{1,3},{2,6},{8,10},{15,18}})
	mergeResult2 := Merge([][]int{{1,4},{4,5}})
	fmt.Println("合并区间: ")
	fmt.Println("[[1,3],[2,6],[8,10],[15,18]]: ",mergeResult1)
	fmt.Println("[[1,4],[4,5]]: ",mergeResult2)
	fmt.Println("=====================================")


	twoSumResult1 := TwoSum([]int{2,7,11,15},9)
	twoSumResult2 := TwoSum([]int{3,2,4},6)
	twoSumResult3 := TwoSum([]int{3,3},6)
	fmt.Println("两数之和: ")
	fmt.Println("[2,7,11,15] 9: ",twoSumResult1)
	fmt.Println("[3,2,4] 6: ",twoSumResult2)
	fmt.Println("[3,3] 6: ",twoSumResult3)
	fmt.Println("=====================================")
}
