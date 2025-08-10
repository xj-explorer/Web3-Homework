package service

import (
	blogModel "blog_system/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetUserArticleList(c *gin.Context) {
	db := blogModel.GetDB()
	type Params struct {
		UserId int `json:"userId" form:"userId" binding:"required"`
	}
	var params Params
	if err := c.ShouldBind(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var articleList []blogModel.Post
	if err := db.Where("author_id = ?", params.UserId).Find(&articleList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get article list"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"articleList": articleList,
	})
}

func GetArticleById(c *gin.Context) {
	db := blogModel.GetDB()
	articleID := c.Query("articleId")
	var article blogModel.Post
	if err := db.Where("id = ?", articleID).First(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get article"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"article": article,
	})
}

func CreateArticle(c *gin.Context) {
	db := blogModel.GetDB()
	var params struct {
		Title    string `json:"title" form:"title" binding:"required"`
		Content  string `json:"content" form:"content" binding:"required"`
		AuthorID uint   `json:"authorId" form:"authorId" binding:"required"`
	}
	if err := c.ShouldBind(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	article := blogModel.Post{Title: params.Title, Content: params.Content, AuthorID: params.AuthorID}
	if err := db.Create(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create article"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"code":      0,
		"articleId": article.ID,
		"message":   "create article success",
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var article blogModel.Post
	if err := db.Where("id = ?", params.ID).First(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get article"})
		return
	}
	if article.AuthorID != params.AuthorID {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Only author can update article"})
		return
	}
	article.Title = params.Title
	article.Content = params.Content
	article.AuthorID = params.AuthorID
	if err := db.Save(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update article"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"data":    article,
		"message": "update article success",
	})
}

func DeleteArticle(c *gin.Context) {
	db := blogModel.GetDB()
	var params struct {
		ID       uint `json:"id" form:"id" binding:"required"`
		AuthorID uint `json:"authorId" form:"authorId" binding:"required"`
	}
	if err := c.ShouldBind(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var article blogModel.Post
	if err := db.Where("id = ?", params.ID).First(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get article"})
		return
	}
	if article.AuthorID != params.AuthorID {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Only author can delete article"})
		return
	}
	db.Delete(&article)
	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"data":    article,
		"message": "delete article success",
	})
}
