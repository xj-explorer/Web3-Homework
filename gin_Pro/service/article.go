package service

import (
	blogModel "blog_system/model"

	"blog_system/utils"

	"github.com/gin-gonic/gin"
)

func GetUserArticleList(c *gin.Context) {
	db := blogModel.GetDB()
	type Params struct {
		UserId int `json:"userId" form:"userId" binding:"required"`
	}
	var params Params
	if err := c.ShouldBind(&params); err != nil {
		utils.Error(c, -1, err.Error())
		return
	}
	var user blogModel.User
	db.Where("id = ?", params.UserId).Find(&user)
	if user.ID == 0 {
		utils.Error(c, -1, "User not found")
		return
	}
	var articleList []blogModel.Post
	if err := db.Where("author_id = ?", params.UserId).Find(&articleList).Error; err != nil {
		utils.Error(c, -1, "Failed to get article list")
		return
	}
	utils.Success(c, articleList)
}

func GetArticleById(c *gin.Context) {
	db := blogModel.GetDB()
	articleID := c.Query("articleId")
	var article blogModel.Post
	if err := db.Where("id = ?", articleID).First(&article).Error; err != nil {
		utils.Error(c, -1, "Failed to get article")
		return
	}
	utils.Success(c, article)
}

func CreateArticle(c *gin.Context) {
	db := blogModel.GetDB()
	var params struct {
		Title    string `json:"title" form:"title" binding:"required"`
		Content  string `json:"content" form:"content" binding:"required"`
		AuthorID uint   `json:"authorId" form:"authorId" binding:"required"`
	}
	if err := c.ShouldBind(&params); err != nil {
		utils.Error(c, -1, err.Error())
		return
	}
	article := blogModel.Post{Title: params.Title, Content: params.Content, AuthorID: params.AuthorID}
	if err := db.Create(&article).Error; err != nil {
		utils.Error(c, -1, "Failed to create article")
		return
	}
	utils.Success(c, gin.H{
		"articleId": article.ID,
	})
}

func UpdateArticle(c *gin.Context) {
	db := blogModel.GetDB()
	type Params struct {
		ID       uint   `json:"id" form:"id" binding:"required"`
		Title    string `json:"title" form:"title" binding:"required"`
		Content  string `json:"content" form:"content" binding:"required"`
		AuthorID uint   `json:"authorId" form:"authorId" binding:"required"`
	}
	var params Params
	if err := c.ShouldBind(&params); err != nil {
		utils.Error(c, -1, err.Error())
		return
	}
	var article blogModel.Post
	if err := db.Where("id = ?", params.ID).First(&article).Error; err != nil {
		utils.Error(c, -1, "Failed to get article")
		return
	}
	if article.AuthorID != params.AuthorID {
		utils.Error(c, -1, "Only author can update article")
		return
	}
	article.Title = params.Title
	article.Content = params.Content
	article.AuthorID = params.AuthorID
	if err := db.Save(&article).Error; err != nil {
		utils.Error(c, -1, "Failed to update article")
		return
	}
	utils.Success(c, article)
}

func DeleteArticle(c *gin.Context) {
	db := blogModel.GetDB()
	var params struct {
		ID       uint `json:"id" form:"id" binding:"required"`
		AuthorID uint `json:"authorId" form:"authorId" binding:"required"`
	}
	if err := c.ShouldBind(&params); err != nil {
		utils.Error(c, -1, err.Error())
		return
	}
	var article blogModel.Post
	if err := db.Where("id = ?", params.ID).First(&article).Error; err != nil {
		utils.Error(c, -1, "Failed to get article")
		return
	}
	if article.AuthorID != params.AuthorID {
		utils.Error(c, -1, "Only author can delete article")
		return
	}
	db.Delete(&article)
	utils.Success(c, gin.H{
		"article": article,
	})
}
