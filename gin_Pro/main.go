package main

import (
	blogModel "blog_system/model"

	"fmt"

	"blog_system/middleWare"
	"blog_system/service"
	"os"

	"log"

	// _ "blog_system/docs"

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

	// 配置Swagger路由outer
	// router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	router.Use(middleWare.JWTAuth())

	// 全局中间件
	// Logger 中间件将日志写入 gin.DefaultWriter，即使你将 GIN_MODE 设置为 release。
	// By default gin.DefaultWriter = os.Stdout
	// router.Use(gin.Logger())

	// Recovery 中间件会 recover 任何 panic。如果有 panic 的话，会写入 500。
	router.Use(gin.Recovery())

	preRouter := router.Group("/api/v1")
	{
		// preRouter.GET("/test", func(c *gin.Context) {
		// 	c.JSON(200, gin.H{
		// 		"message": "pong",
		// 	})
		// })
		preRouter.POST("/register", service.Register)

		preRouter.POST("/login", service.Login)

		article := preRouter.Group("/article")
		{
			article.GET("/getList", service.GetUserArticleList)
			article.GET("/getByID", service.GetArticleById)
			article.POST("/create", service.CreateArticle)
			article.POST("/update", service.UpdateArticle)
			article.POST("/delete", service.DeleteArticle)
		}

		comment := preRouter.Group("/comment")
		{
			comment.GET("/getList", service.GetCommentById)
			comment.POST("/create", service.CreateComment)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // 默认端口
	}
	fmt.Println("Server is running on port " + port)
	router.Run(":" + port)
}
