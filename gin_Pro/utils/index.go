package utils

import (
	"github.com/gin-gonic/gin"
)

type Response struct {
	Code    int         `json:"code"`
	Data    interface{} `json:"data"`
	Message string      `json:"message"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(200, Response{Code: 0, Data: data, Message: "success"})
}

func Error(c *gin.Context, code int, msg string) {
	c.JSON(200, Response{Code: code, Message: msg, Data: nil})
}
