package service

import (
	blogModel "blog_system/model"
	"time"

	"blog_system/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateComment(c *gin.Context) {
	db := blogModel.GetDB()
	type Params struct {
		Content string `json:"content" form:"content" binding:"required"`
		PostID  uint   `json:"postId" form:"postId" binding:"required"`
		UserID  uint   `json:"userId" form:"userId" binding:"required"`
	}
	var params Params
	if err := c.ShouldBind(&params); err != nil {
		utils.Error(c, -1, err.Error())
		return
	}
	var comment blogModel.Comment
	comment.Content = params.Content
	comment.PostID = params.PostID
	comment.UserID = params.UserID
	if err := db.Create(&comment).Error; err != nil {
		utils.Error(c, -1, "Failed to create comment")
		return
	}
	type UserDTO struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
		Email    string `json:"email"`
	}
	type CommentDTO struct {
		ID        uint      `json:"id"`
		Content   string    `json:"content"`
		User      UserDTO   `json:"user"`
		PostID    uint      `json:"post_id"`
		CreatedAt time.Time `json:"created_at"`
	}

	// 转换为DTO
	commentDTO := CommentDTO{
		ID:      comment.ID,
		Content: comment.Content,
		User: UserDTO{
			ID:       comment.User.ID,
			Username: comment.User.Username,
			Email:    comment.User.Email,
		},
		PostID:    comment.PostID,
		CreatedAt: comment.CreatedAt,
	}

	utils.Success(c, gin.H{
		"comment": commentDTO,
	})
}

func GetCommentById(c *gin.Context) {
	db := blogModel.GetDB()
	articleID := c.Query("articleId")
	var commentList []blogModel.Comment
	if err := db.Where("post_id = ?", articleID).Preload("User", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, username, email") // 排除password
	}).Find(&commentList).Error; err != nil {
		utils.Error(c, -1, "Failed to get comment list")
		return
	}

	// 定义不带密码的UserDTO
	type UserDTO struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
		Email    string `json:"email"`
	}
	type CommentDTO struct {
		ID        uint      `json:"id"`
		Content   string    `json:"content"`
		User      UserDTO   `json:"user"`
		PostID    uint      `json:"post_id"`
		CreatedAt time.Time `json:"created_at"`
	}

	// 转换为DTO
	var commentDTOs []CommentDTO
	for _, c := range commentList {
		commentDTOs = append(commentDTOs, CommentDTO{
			ID:      c.ID,
			Content: c.Content,
			User: UserDTO{
				ID:       c.User.ID,
				Username: c.User.Username,
				Email:    c.User.Email,
			},
			PostID:    c.PostID,
			CreatedAt: c.CreatedAt,
		})
	}
	utils.Success(c, gin.H{
		"commentList": commentDTOs,
	})
}
