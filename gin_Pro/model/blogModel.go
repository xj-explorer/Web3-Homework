// model/blogModel.go
package blogModel

import (
	"fmt"
	"log"
	"sync"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string
	Password string
	Email    string
	Posts    []Post `gorm:"foreignKey:AuthorID"`
	PostNum  int
}

type Post struct {
	gorm.Model
	Title      string
	Content    string
	AuthorID   uint
	Comments   []Comment
	CommentNum int
}

type Comment struct {
	gorm.Model
	Content string
	User    User
	UserID  uint
	PostID  uint
}

// 全局数据库实例和单例锁
var (
	db   *gorm.DB
	once sync.Once
)

// GetDB 获取全局数据库连接实例
func GetDB() *gorm.DB {
	once.Do(func() {
		var err error
		dsn := "root:xiejun123@tcp(127.0.0.1:3306)/gorm?charset=utf8mb4&parseTime=True&loc=Local"
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatal("Failed to connect to database:", err)
		}

		// 可以配置连接池参数
		sqlDB, err := db.DB()
		if err != nil {
			log.Fatal("Failed to get sql.DB:", err)
		}

		// 设置连接池参数
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetMaxOpenConns(100)
		sqlDB.SetConnMaxLifetime(-1) // 永不过期

		fmt.Println("Database connection initialized")
	})
	return db
}

func (p *Post) AfterCreate(tx *gorm.DB) (err error) {
	tx.Model(&User{}).Where("id = ?", p.AuthorID).Update("post_num", gorm.Expr("post_num + ?", 1))
	return
}

func (p *Post) BeforeDelete(tx *gorm.DB) (err error) {
	tx.Model(&User{}).Where("id = ?", p.AuthorID).Update("post_num", gorm.Expr("post_num - ?", 1))
	return
}

func (c *Comment) AfterCreate(tx *gorm.DB) (err error) {
	tx.Model(&Post{}).Where("id = ?", c.PostID).Update("comment_num", gorm.Expr("comment_num + ?", 1))
	return
}

func (c *Comment) BeforeDelete(tx *gorm.DB) (err error) {
	tx.Model(&Post{}).Where("id = ?", c.PostID).Update("comment_num", gorm.Expr("comment_num - ?", 1))
	return
}

func InitDB() {
	// 设计数据库表结构，至少包含以下几个表：
	// users 表：存储用户信息，包括 id 、 username 、 password 、 email 等字段。
	// posts 表：存储博客文章信息，包括 id 、 title 、 content 、 user_id （关联 users 表的 id ）、 created_at 、 updated_at 等字段。
	// comments 表：存储文章评论信息，包括 id 、 content 、 user_id （关联 users 表的 id ）、 post_id （关联 posts 表的 id ）、 created_at 等字段。
	// 使用 GORM 定义对应的 Go 模型结构体。
	db := GetDB()
	db.AutoMigrate(&User{}, &Post{}, &Comment{})
	// db.Create(&User{Username: "Jenson", Password: "123456", PostNum: 2})
	// db.Create(&Post{Title: "Post1", Content: "Content1", CommentNum: 3, AuthorID: 1})
	// db.Create(&Post{Title: "Post2", Content: "Content2", CommentNum: 2, AuthorID: 1})
	// db.Create(&Comment{Content: "Comment1", UserID: 1, PostID: 1})
	// db.Create(&Comment{Content: "Comment2", UserID: 1, PostID: 1})
	// db.Create(&Comment{Content: "Comment3", UserID: 1, PostID: 1})
	// db.Create(&Comment{Content: "Comment4", UserID: 1, PostID: 2})
	// db.Create(&Comment{Content: "Comment5", UserID: 1, PostID: 2})
}
