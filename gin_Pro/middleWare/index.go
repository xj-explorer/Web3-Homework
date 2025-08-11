package middleWare

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 定义不需要认证的路径
		noAuthPaths := []string{
			"/api/v1/register",
			"/api/v1/login",
		}

		// 检查当前路径是否需要认证
		currentPath := c.Request.URL.Path
		needAuth := true
		for _, path := range noAuthPaths {
			if currentPath == path {
				needAuth = false
				break
			}
		}

		// 如果不需要认证，直接通过
		if !needAuth {
			c.Next()
			return
		}

		// 检查 JWT_SECRET 是否设置
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			log.Fatal("JWT_SECRET environment variable is not set")
		}

		tokenString := strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			c.Set("userId", claims["userId"])
			c.Set("userName", claims["userName"])
			c.Next()
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		}
	}
}
