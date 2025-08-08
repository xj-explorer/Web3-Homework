package gormpractice1

import (
	"fmt"

	"gorm.io/gorm"
)

type Student struct {
	gorm.Model
	ID    int
	Name  string
	Age   int
	Grade string
}

type Account struct {
	gorm.Model
	ID      int
	Balance float64
}

type Transaction struct {
	gorm.Model
	ID            int
	FromAccountID int
	ToAccountID   int
	Amount        float64
}

func Run(db *gorm.DB) {
	fmt.Println("=====grom practice1====")
	// db.AutoMigrate(&Student{})
	// 编写SQL语句向 students 表中插入一条新记录
	// student := Student{Name: "Jenson", Age: 16, Grade: "九年级"}
	// db.Create(&student)

	//编写SQL语句查询 students 表中所有年龄大于 18 岁的学生信息。
	// students := []Student{}
	// db.Where("age > ?", 18).Find(&students)
	// fmt.Println(students)

	//编写SQL语句将 students 表中姓名为 "Jerry 的学生年级更新为 "四年级"。
	// db.Model(&Student{}).Where("name = ?", "Jerry").Update("grade", "四年级")

	//编写SQL语句删除 students 表中年龄小于 18 岁的学生记录。
	// db.Where("age < ?", 18).Delete(&Student{})

	// 假设有两个表： accounts 表（包含字段 id 主键， balance 账户余额）和 transactions 表（包含字段 id 主键， from_account_id 转出账户ID， to_account_id 转入账户ID， amount 转账金额）。
	// 要求 ：
	// 编写一个事务，实现从账户 A 向账户 B 转账 100 元的操作。在事务中，需要先检查账户 A 的余额是否足够，如果足够则从账户 A 扣除 100 元，向账户 B 增加 100 元，并在 transactions 表中记录该笔转账信息。如果余额不足，则回滚事务。
	// db.AutoMigrate(&Account{})
	// db.AutoMigrate(&Transaction{})
	// db.Create(&Account{Balance: 500})
	// db.Create(&Account{Balance: 500})
	// db.Transaction(func(tx *gorm.DB) error {
	// 	var accountA Account
	// 	var accountB Account
	// 	tx.First(&accountA, 1)
	// 	tx.First(&accountB, 2)
	// 	if accountA.Balance < 100 {
	// 		return errors.New("account A has insufficient balance") // 返回任何错误都会回滚事务
	// 	}
	// 	accountA.Balance -= 100
	// 	accountB.Balance += 100
	// 	tx.Save(&accountA)
	// 	tx.Save(&accountB)
	// 	if err := tx.Create(&Transaction{FromAccountID: accountA.ID, ToAccountID: accountB.ID, Amount: 100}).Error; err != nil {
	// 		return err
	// 	}
	// 	// return errors.New("test error")
	// 	return nil
	// })

}
