package main

// Config 存储比特币测试网络的配置信息
type Config struct {
	// RPC服务器地址
	RPCServer string
	// RPC用户
	RPCUser string
	// RPC密码
	RPCPassword string
	// 是否使用TLS
	UseTLS bool
}

// GetDefaultConfig 返回默认配置
func GetDefaultConfig() *Config {
	return &Config{
		// 使用公共的比特币测试网络节点
		// 注意：实际使用时，可能需要替换为自己的节点或第三方服务
		// RPCServer: "testnet.blockchain.info:18332",
		RPCServer:   "testnet.qtornado.com:51002",
		RPCUser:     "",
		RPCPassword: "",
		UseTLS:      false,
	}
}

// GetBlockCypherConfig 返回BlockCypher服务的配置
// 注意：BlockCypher需要API密钥，需要在RPCUser字段中提供
func GetBlockCypherConfig(apiKey string) *Config {
	return &Config{
		RPCServer:   "api.blockcypher.com:443/v1/btc/test3",
		RPCUser:     apiKey,
		RPCPassword: "",
		UseTLS:      true,
	}
}

// GetBlockstreamConfig 返回Blockstream.info服务的配置
// 这是一个公共API，不需要API密钥
func GetBlockstreamConfig() *Config {
	return &Config{
		RPCServer:   "blockstream.info/testnet/api",
		RPCUser:     "",
		RPCPassword: "",
		UseTLS:      true,
	}
}
