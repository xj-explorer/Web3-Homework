package main

// import (
// 	"fmt"
// )

func PointerChange(num *int) {
	*num += 10
}

func SliceChange(numArr *[]int) {
	for i := 0; i < len(*numArr); i++ {
		(*numArr)[i] *= 2
	}
}