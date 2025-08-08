package main

import (
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormadvanced "ithub.com/xj-explorer/Web3-Homework/golang_Gorm/gormAdvanced"
	gormpractice1 "ithub.com/xj-explorer/Web3-Homework/golang_Gorm/gormPractice1"
	gormpractice2 "ithub.com/xj-explorer/Web3-Homework/golang_Gorm/gormPractice2"
)

func InitDB() *gorm.DB {
	db, err := gorm.Open(mysql.Open("root:xiejun123@tcp(127.0.0.1:3306)/gorm?charset=utf8mb4&parseTime=True&loc=Local"))
	if err != nil {
		panic(err)
	}
	return db
}

func main() {
	db := InitDB()
	gormpractice1.Run(db)
	gormpractice2.Run(db)
	gormadvanced.Run(db)

	fmt.Println("=====End=====")
}
