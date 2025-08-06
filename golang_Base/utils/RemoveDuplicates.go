package utils
import "fmt"
func RemoveDuplicates(nums []int) int {
    singleArr := []int{}
    for _,val := range nums {
        if !IsInclude(singleArr,val) {
            singleArr = append(singleArr,val)
        }
    }
    for index,num := range singleArr {
        nums[index] = num
    }
	fmt.Println(singleArr)
    return len(singleArr)
}

