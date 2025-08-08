package gormadvanced

import (
	"fmt"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name     string
	Password string
	Posts    []Post
	PostNum  int
}

type Post struct {
	gorm.Model
	Title         string
	Content       string
	Comments      []Comment
	CommentNum    int
	UserID        uint
	CommentStatus string
}

type Comment struct {
	gorm.Model
	Content string
	User    User
	UserID  uint
	PostID  uint
}

func (p *Post) AfterCreate(tx *gorm.DB) (err error) {
	tx.Model(&User{}).Where("id = ?", p.UserID).Update("post_num", gorm.Expr("post_num + ?", 1))
	return
}

func (c *Comment) BeforeDelete(tx *gorm.DB) (err error) {
	fmt.Println("BeforeDelete")
	fmt.Println(c)
	tx.Model(&Post{}).Where("id = ?", c.PostID).Update("comment_num", gorm.Expr("comment_num - ?", 1))
	var post Post
	tx.Model(&Post{}).Where("id = ?", c.PostID).First(&post)
	if post.CommentNum == 0 {
		tx.Model(&Post{}).Where("id = ?", c.PostID).Update("comment_status", "无评论")
	}
	return
}

func Run(db *gorm.DB) {
	fmt.Println("=====Gorm Advanced=====")

	// 题目1：模型定义
	// 假设你要开发一个博客系统，有以下几个实体： User （用户）、 Post （文章）、 Comment （评论）。
	// 要求 ：
	// 使用Gorm定义 User 、 Post 和 Comment 模型，其中 User 与 Post 是一对多关系（一个用户可以发布多篇文章）， Post 与 Comment 也是一对多关系（一篇文章可以有多个评论）。
	// 编写Go代码，使用Gorm创建这些模型对应的数据库表。
	// db.AutoMigrate(&User{})
	// db.AutoMigrate(&Post{})
	// db.AutoMigrate(&Comment{})
	// db.Create(&User{Name: "Jenson", Password: "123456", PostNum: 2})
	// db.Create(&Post{Title: "Post1", Content: "Content1", CommentNum: 3, UserID: 1, CommentStatus: "有评论"})
	// db.Create(&Post{Title: "Post2", Content: "Content2", CommentNum: 2, UserID: 1, CommentStatus: "有评论"})
	// db.Create(&Comment{Content: "Comment1", UserID: 1, PostID: 1})
	// db.Create(&Comment{Content: "Comment2", UserID: 1, PostID: 1})
	// db.Create(&Comment{Content: "Comment3", UserID: 1, PostID: 1})
	// db.Create(&Comment{Content: "Comment4", UserID: 1, PostID: 2})
	// db.Create(&Comment{Content: "Comment5", UserID: 1, PostID: 2})

	// 题目2：关联查询
	// 基于上述博客系统的模型定义。
	// 要求 ：
	// 编写Go代码，使用Gorm查询某个用户发布的所有文章及其对应的评论信息。
	// var user User
	// db.Preload("Posts").Preload("Posts.Comments").First(&user, 1)
	// for _, post := range user.Posts {
	// 	fmt.Println(post.Title, len(post.Comments))
	// 	fmt.Println(post.Title, post.Comments)
	// }
	// 编写Go代码，使用Gorm查询评论数量最多的文章信息。
	var post Post
	db.Debug().Order("comment_num desc").First(&post)
	fmt.Println(post)

	// 题目3：钩子函数
	// 继续使用博客系统的模型。
	// 要求 ：
	// 为 Post 模型添加一个钩子函数，在文章创建时自动更新用户的文章数量统计字段。
	// db.Create(&Post{Title: "Golang", Content: "Golang is a good language.", UserID: 1})
	// db.Create(&Comment{Content: "Comment6", UserID: 1, PostID: 2})

	// 为 Comment 模型添加一个钩子函数，在评论删除时检查文章的评论数量，如果评论数量为 0，则更新文章的评论状态为 "无评论"。
	// 直接通过 ID 删除，未加载实例到内存
	// db.Delete(&Comment{}, 1) // 这种方式获取不到被删除的示例值的数据

	// 先查询获取完整实例，再删除
	// var comment Comment
	// db.First(&comment, 6) // 先从数据库加载实例
	// db.Delete(&comment)   // 此时钩子能获取到 comment 的所有字段值
}
