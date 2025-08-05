package main

import "fmt"

func init() {
	fmt.Println("=====init=====")
}

func SingleNumber(nums []int) int {
	mapVal := make(map[int]int)
	var result int
	for _, value := range nums {
		_, isExist := mapVal[value]
		if !isExist {
			mapVal[value] = 1
		} else {
			mapVal[value]++
		}
	}
	for key, value := range mapVal {
		if value == 1 {
			result = key
		}
	}
	return result
}

func main() {
	singleNumberResult := SingleNumber([]int{2, 2, 1})
	fmt.Println(singleNumberResult)
}
