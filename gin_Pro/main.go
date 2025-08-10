package main

import (
	blogModel "blog_system/model"

	"fmt"

	"blog_system/middleWare"
	"blog_system/service"
	"os"

	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	// 加载 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}
}

func main() {
	// 初始化数据库连接
	blogModel.InitDB()

	router := gin.Default()

	router.Use(middleWare.JWTAuth())

	router.POST("/register", service.Register)

	router.POST("/login", service.Login)

	article := router.Group("/article")
	{
		article.GET("/getList", service.GetUserArticleList)
		article.GET("/getByID", service.GetArticleById)
		article.POST("/create", service.CreateArticle)
		article.POST("/update", service.UpdateArticle)
		article.POST("/delete", service.DeleteArticle)
	}

	comment := router.Group("/comment")
	{
		comment.GET("/getList", service.GetCommentById)
		comment.POST("/create", service.CreateComment)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // 默认端口
	}
	fmt.Println("Server is running on port " + port)
	router.Run(":" + port)
}
