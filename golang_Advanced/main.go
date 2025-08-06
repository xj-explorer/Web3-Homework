package main

import (
	"fmt"
)

func init() {
	// fmt.Println("=====init=====")
}

func main() {
	fmt.Println("=====Pointer=====")
	// var a int = 10
	// PointerChange(&a)
	// fmt.Println(a)
	// var b []int = []int{1,2,3,4,5}
	// SliceChange(&b)
	// fmt.Println(b)

	fmt.Println("=====Goroutine=====")
	// // GoroutineDemo()
	// TaskDispatch([]func(){
	// 	func() {
	// 		time.Sleep(1 * time.Second)
	// 	},
	// 	func() {
	// 		time.Sleep(2 * time.Second)
	// 	},
	// })

	fmt.Println("=====OOP=====")
	// OopDemo()
	// employee := Employee{
	// 	Person: Person{
	// 		Name: Name{Value: "Jenson"},
	// 		Age:  Age{Value: 18},
	// 	},
	// 	EmployeeID: 1998,
	// }
	// employee.PringInfo()

	fmt.Println("=====Channel=====")
	// ChannelDemo()
	// ChannelCache()

	fmt.Println("=====syncLock=====")
	// SyncMutex()
	SyncAtomic()

}
