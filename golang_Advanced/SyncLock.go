package main

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

func SyncMutex() {
	timer := 0
	syncLock := sync.Mutex{}
	for i := 0; i < 10; i++ {
		go func() {
			for i := 0; i < 1000; i++ {
				syncLock.Lock()
				timer++
				syncLock.Unlock()
			}
		}()
	}
	time.Sleep(1 * time.Second)
	fmt.Println(timer)
}

func SyncAtomic() {
	var timer int32 = 0
	for i := 0; i < 10; i++ {
		go func() {
			for i := 0; i < 1000; i++ {
				atomic.AddInt32(&timer, 1)
			}
		}()
	}
	time.Sleep(1 * time.Second)
	fmt.Println(timer)
}
