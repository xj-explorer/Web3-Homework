package utils

func TwoSum(nums []int, target int) []int {
    for i:=0; i<len(nums); i++{
        for j:=len(nums)-1; j>i; j-- {
            if nums[i]+nums[j] == target {
                return []int{i,j}
            }
        }
    }
    return []int{}
}