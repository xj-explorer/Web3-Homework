package main

import (
	"fmt"
	"math"
)

// 练习1
type Shape interface {
	Area() float64
	Perimeter() float64
}

type Rectangle struct {
	Width  float64
	Height float64
}

func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

type Circle struct {
	Radius float64
}

func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius
}

func OopDemo() {
	r := Rectangle{Width: 10.0, Height: 5.0}
	c := Circle{Radius: 5.0}
	fmt.Println("矩形面积:", r.Area())
	fmt.Println("矩形周长:", r.Perimeter())
	fmt.Println("圆面积:", c.Area())
	fmt.Println("圆周长:", c.Perimeter())
}

// =======================================
// 练习2
type Employ interface {
	PringInfo()
}

// 定义基础结构体 - 姓名
type Name struct {
	Value string
}

// 定义基础结构体 - 年龄
type Age struct {
	Value int
}

// 使用组合的方式创建 Person 结构体
type Person struct {
	Name
	Age
}

type Employee struct {
	Person
	EmployeeID int
}

func (e Employee) PringInfo() {
	fmt.Println("EmployeeID:", e.EmployeeID)
	fmt.Println("Name:", e.Name.Value)
	fmt.Println("Age:", e.Age.Value)
}
