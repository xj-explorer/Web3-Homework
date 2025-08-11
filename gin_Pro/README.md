# Gin 项目

### 运行环境
```go
go version go1.23.11
```


### 安装依赖：
```go
项目根目录下执行：
go mod tidy
```


### 项目启动：默认端口为8080可在.env文件中配置
```go
go run main.go
```


### 项目打包可执行文件：
```go
go build -o blog.exe
```



### 测试用例

#### 注册：/api/v1/register

```GO
请求方法：POST  x-www-form-urlencoded
请求参数：
username: "测试用户1"
password: "ceshi123"
email: "test@abc.com"
响应结果：
{
    "code": 0,
    "data": null,
    "message": "success"
}
```

#### 登录：/api/v1/login

```go
请求方法：POST  x-www-form-urlencoded
请求参数：
username: "测试用户1"
password: "ceshi123"
响应结果：
{
    "code": 0,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTQ5ODY1NzIsInVzZXJJZCI6MywidXNlck5hbWUiOiLmnpfoirgifQ.VPrymzSb8uCCo35o4dy5NAaQHAEIQmMKFSLSp4O2OIg",
        "userId": 3,
        "username": "测试用户1"
    },
    "message": "success"
}
```

#### 获取用户全部文章：/api/v1/article/getList

```go
请求方法：GET
请求参数：
userId: 1
响应结果：
{
    "code": 0,
    "data": [
        {
            "ID": 2,
            "CreatedAt": "2025-08-10T14:22:14.185+08:00",
            "UpdatedAt": "2025-08-10T14:22:14.203+08:00",
            "DeletedAt": null,
            "Title": "Post2",
            "Content": "Content2",
            "AuthorID": 2,
            "Comments": null,
            "CommentNum": 1
        },
        {
            "ID": 3,
            "CreatedAt": "2025-08-10T15:22:14.185+08:00",
            "UpdatedAt": "2025-08-11T02:12:41.109+08:00",
            "DeletedAt": null,
            "Title": "晓",
            "Content": "内容",
            "AuthorID": 2,
            "Comments": null,
            "CommentNum": 3
        },
        {
            "ID": 4,
            "CreatedAt": "2025-08-11T01:10:13.615+08:00",
            "UpdatedAt": "2025-08-11T02:18:03.862+08:00",
            "DeletedAt": null,
            "Title": "新标题",
            "Content": "我是新内容哈哈哈",
            "AuthorID": 2,
            "Comments": null,
            "CommentNum": 1
        },
    ],
    "message": "success"
}
```

#### 获取文章详情：/api/v1/article/getByID

```go
请求方法：GET
请求参数：
articleId: 3
响应结果：
{
    "code": 0,
    "data": {
        "ID": 3,
        "CreatedAt": "2025-08-10T15:22:14.185+08:00",
        "UpdatedAt": "2025-08-11T02:12:41.109+08:00",
        "DeletedAt": null,
        "Title": "李晓桂",
        "Content": "内容",
        "AuthorID": 2,
        "Comments": null,
        "CommentNum": 3
    },
    "message": "success"
}
```

#### 创建文章：/api/v1/article/create

```go
请求方法：POST  x-www-form-urlencoded
请求参数：
title: "测试文章标题"
content: "文章内容"
authorId: 1
响应结果：
{
    "code": 0,
    "data": {
        "articleId": 7
    },
    "message": "success"
}
```

#### 更新文章：/api/v1/article/update

```go
请求方法：POST  x-www-form-urlencoded
请求参数：
id: 4
title: "新标题" 
content: "我是新内容" 
authorId: 2
响应结果：
{
    "code": 0,
    "data": {
        "ID": 4,
        "CreatedAt": "2025-08-11T01:10:13.615+08:00",
        "UpdatedAt": "2025-08-11T16:34:48.117+08:00",
        "DeletedAt": null,
        "Title": "新标题1",
        "Content": "我是新内容哈哈哈",
        "AuthorID": 2,
        "Comments": null,
        "CommentNum": 1
    },
    "message": "success"
}
```

#### 删除文章：/api/v1/article/delete

```go
请求方法：POST  x-www-form-urlencoded
请求参数：
id: 1
authorid:
响应结果：
{
    "code": 0,
    "data": {
        "article": {
            "ID": 6,
            "CreatedAt": "2025-08-11T02:14:21.912+08:00",
            "UpdatedAt": "2025-08-11T02:14:21.912+08:00",
            "DeletedAt": "2025-08-11T16:36:03.357+08:00",
            "Title": "老李哈哈哈",
            "Content": "合久必分",
            "AuthorID": 1,
            "Comments": null,
            "CommentNum": 0
        }
    },
    "message": "success"
}
```

#### 获取文章全部评论：/api/v1/comment/getList

```go
请求方法：GET
请求参数：
articleId: 1
响应结果：
{
    "code": 0,
    "data": {
        "commentList": [
            {
                "id": 1,
                "content": "Comment1",
                "user": {
                    "id": 1,
                    "username": "Jenson",
                    "email": "test@qq.com"
                },
                "post_id": 1,
                "created_at": "2025-08-10T14:22:14.188+08:00"
            },
            {
                "id": 3,
                "content": "Comment3",
                "user": {
                    "id": 1,
                    "username": "Jenson",
                    "email": "test@qq.com"
                },
                "post_id": 1,
                "created_at": "2025-08-10T14:22:14.197+08:00"
            }
        ]
    },
    "message": "success"
}
```

#### 创建文章评论：/api/v1/comment/create

```go
请求方法：POST  x-www-form-urlencoded
请求参数：
content: "新评论"
userId: 2
postId: 4
响应结果：
{
    "code": 0,
    "data": {
        "comment": {
            "id": 8,
            "content": "新的老林评论",
            "user": {
                "id": 0,
                "username": "",
                "email": ""
            },
            "post_id": 4,
            "created_at": "2025-08-11T16:38:11.308+08:00"
        }
    },
    "message": "success"
}
```


