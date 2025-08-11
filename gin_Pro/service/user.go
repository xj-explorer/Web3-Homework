package service

import (
	blogModel "blog_system/model"
	"blog_system/utils"
	"time"

	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

type RegisterParams struct {
	Username string `json:"username" form:"username" binding:"required"`
	Password string `json:"password" form:"password" binding:"required"`
	Email    string `json:"email" form:"email" binding:"required,email"`
}

type LoginParams struct {
	Username string `json:"username" form:"username" binding:"required"`
	Password string `json:"password" form:"password" binding:"required"`
}

func Register(c *gin.Context) {
	db := blogModel.GetDB()
	var params RegisterParams
	if err := c.ShouldBind(&params); err != nil {
		utils.Error(c, -1, err.Error())
		return
	}
	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(params.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.Error(c, -1, "Failed to hash password")
		return
	}
	params.Password = string(hashedPassword)
	if err := db.Create(&blogModel.User{
		Username: params.Username,
		Password: string(hashedPassword),
		Email:    params.Email,
	}).Error; err != nil {
		utils.Error(c, -1, "Failed to create user")
		return
	}
	utils.Success(c, nil)
}

func Login(c *gin.Context) {
	db := blogModel.GetDB()
	var params LoginParams
	if err := c.ShouldBind(&params); err != nil {
		utils.Error(c, -1, err.Error())
		return
	}

	var storedUser blogModel.User
	if err := db.Where("username = ?", params.Username).First(&storedUser).Error; err != nil {
		utils.Error(c, -1, "Invalid username or password")
		return
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(storedUser.Password), []byte(params.Password)); err != nil {
		utils.Error(c, -1, "Invalid username or password")
		return
	}

	// 生成 JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId":   storedUser.ID,
		"userName": storedUser.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	// 检查 JWT_SECRET 是否设置
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is not set")
	}
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		utils.Error(c, -1, "Failed to generate token")
		return
	}
	utils.Success(c, gin.H{
		"token":    tokenString,
		"userId":   storedUser.ID,
		"username": storedUser.Username,
	})
}
