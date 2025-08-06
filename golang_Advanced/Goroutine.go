package main

import (
	"fmt"
	"sync"
	"time"
)

func GoroutineDemo() {
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		for i := 0; i < 10; i++ {
			if i%2 != 0 {
				fmt.Println("Goroutine: ", i)
			}
		}
	}()

	go func() {
		defer wg.Done()
		for i := 0; i < 10; i++ {
			if i%2 == 0 {
				fmt.Println("Goroutine: ", i)
			}
		}
	}()
	wg.Wait()
	fmt.Println("Main: ", 1)
}

func TaskDispatch(funcs []func()) {
	// fmt.Println("=====taskDispatch=====")
	var wg sync.WaitGroup
	wg.Add(len(funcs))
	for index, f := range funcs {
		go func(index int) {
			defer wg.Done()
			startTime := time.Now()
			f()
			fmt.Println("func", index+1, "task done, ", "cost: ", time.Since(startTime))
		}(index)
	}
	wg.Wait()
}
