package main

import (
	"fmt"
	"sync"
	"time"
)

func sendOnly(ch chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for i := 0; i < 10; i++ {
		// 模拟channel缓冲值的作用
		fmt.Printf("发送前: %d\n", i+1)
		ch <- i + 1
		fmt.Printf("发送后: %d\n", i+1)
	}
	close(ch)
	fmt.Println("Channel closed")
}

func receiveOnly(ch <-chan int, wg *sync.WaitGroup) {
	defer wg.Done()
	for v := range ch {
		// 模拟channel缓冲值的作用
		time.Sleep(500 * time.Millisecond)
		fmt.Println(v)
	}

}

func ChannelDemo() {
	ch := make(chan int)
	wg := sync.WaitGroup{}
	wg.Add(2)
	go func() {
		defer wg.Done()
		for i := 0; i < 10; i++ {
			ch <- i + 1
		}
		close(ch)
	}()
	go func() {
		defer wg.Done()
		for v := range ch {
			fmt.Println(v)
		}
	}()
	wg.Wait()
}

func ChannelCache() {
	ch := make(chan int, 2)
	wg := sync.WaitGroup{}
	wg.Add(2)
	go sendOnly(ch, &wg)
	go receiveOnly(ch, &wg)
	wg.Wait()
}
