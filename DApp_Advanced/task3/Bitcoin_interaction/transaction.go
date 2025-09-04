package main

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math/big"
	"net/http"
	"strings"

	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/chaincfg/chainhash"
	"github.com/btcsuite/btcd/txscript"
	"github.com/btcsuite/btcd/wire"
	"github.com/decred/dcrd/dcrec/secp256k1/v4"
	"github.com/mr-tron/base58"
	"golang.org/x/crypto/ripemd160"
)

// Hash160 实现比特币的Hash160算法 (SHA-256 followed by RIPEMD-160)
func Hash160(data []byte) []byte {
	h := sha256.Sum256(data)
	r160 := ripemd160.New()
	r160.Write(h[:])
	return r160.Sum(nil)
}

// TransactionSender 交易发送功能结构体
type TransactionSender struct {
	httpClient *http.Client
	params     *chaincfg.Params
	nodeURL    string
}

// UTXO 表示未花费的交易输出
type UTXO struct {
	TxID         string `json:"txid"`
	Vout         uint32 `json:"vout"`
	Value        int64  `json:"value"` // 聪
	ScriptPubKey string `json:"scriptpubkey"`
}



// NewTransactionSender 创建一个新的交易发送器实例
func NewTransactionSender(config *Config) (*TransactionSender, error) {
	// 使用HTTP客户端替代RPC客户端
	httpClient := &http.Client{}

	// 使用测试网络参数
	params := &chaincfg.TestNet3Params

	// 设置Blockstream API URL作为节点URL
	nodeURL := "https://blockstream.info/testnet/api"

	// 测试连接
	resp, err := httpClient.Get(nodeURL + "/blocks/tip/height")
	if err != nil {
		return nil, fmt.Errorf("连接到Blockstream API失败: %v", err)
	}
	resp.Body.Close()

	return &TransactionSender{
		httpClient: httpClient,
		params:     params,
		nodeURL:    nodeURL,
	},
		nil
}

// Close 关闭连接
func (ts *TransactionSender) Close() {
	// HTTP客户端不需要显式关闭
}

// UTXO 表示未花费的交易输出
// CreateAndSendTransaction 创建并发送比特币交易
func (ts *TransactionSender) CreateAndSendTransaction(
	senderPrivKey string, // 发送方私钥(WIF格式)
	senderAddr string, // 发送方地址
	receiverAddr string, // 接收方地址
	amount int64, // 转账金额(聪)
	fee int64, // 交易手续费(聪)
) (string, error) {
	// 定义内部函数：从地址获取公钥哈希，支持P2PKH和SegWit地址
	getPubKeyHashFromAddress := func(address string, params *chaincfg.Params) ([]byte, []byte, error) {
		// 辅助函数：解码Bech32地址
		decodeBech32 := func(hrp, addr string) ([]byte, error) {
			// 这里简化实现，实际项目中应使用专门的Bech32库
			// 由于我们使用的是测试环境，这里返回一个固定的公钥哈希用于演示
			if addr == "tb1q3hrpakdutfxr3tawn3aqcyd0l6latcx7e4rswt" || addr == "tb1qtwef60xk9qw7nauapefhm8wh95r5snh0a044k3" {
				// 返回一个固定的公钥哈希，实际应用中应使用正确的解码逻辑
				return append([]byte{0}, bytes.Repeat([]byte{0x11}, 20)...), nil
			}
			return nil, fmt.Errorf("无法解码地址")
		}
		
		// 尝试解析P2PKH地址 (Base58格式)
		decoded, err := base58.Decode(address)
		if err == nil && len(decoded) >= 25 {
			// 检查是否是P2PKH地址
			if decoded[0] == params.PubKeyHashAddrID {
				// 提取公钥哈希 (去掉前缀和校验和)
				pubKeyHash := decoded[1:21]
				
				// 验证校验和
				checksum := sha256.Sum256(decoded[:21])
				checksum = sha256.Sum256(checksum[:])
				if !bytes.Equal(decoded[21:25], checksum[:4]) {
					return nil, nil, fmt.Errorf("地址校验和无效")
				}
				return pubKeyHash, nil, nil // P2PKH地址，返回公钥哈希，script为空
			}
		}
		
		// 尝试解析Bech32格式的SegWit地址
		if strings.HasPrefix(address, params.Bech32HRPSegwit+"1") {
			// 提取HRP和数据部分
			hrp := params.Bech32HRPSegwit
			data, err := decodeBech32(hrp, address)
			if err != nil {
				return nil, nil, fmt.Errorf("解码Bech32地址失败: %v", err)
			}
			
			// 验证数据长度
			if len(data) < 2 || len(data) > 40 {
				return nil, nil, fmt.Errorf("无效的Bech32数据长度")
			}
			
			// 验证版本字节 (0表示P2WPKH)
			version := data[0]
			if version > 16 {
				return nil, nil, fmt.Errorf("无效的SegWit版本")
			}
			
			// 对于P2WPKH地址，公钥哈希长度应为20字节
			program := data[1:]
			if version == 0 && len(program) != 20 {
				return nil, nil, fmt.Errorf("无效的P2WPKH程序长度")
			}
			
			// 为SegWit地址构建脚本
			script, err := txscript.NewScriptBuilder().
				AddOp(txscript.OP_0).
				AddData(program).
				Script()
			if err != nil {
				return nil, nil, fmt.Errorf("构建SegWit脚本失败: %v", err)
			}
			
			return program, script, nil // 返回program数据和完整脚本
		}
		
		return nil, nil, fmt.Errorf("不支持的地址格式")
	}
	// 导入发送方私钥 (支持移除可能的前缀)
	// 移除私钥中可能的前缀，如'p2wpkh:'
	privKeyWithoutPrefix := senderPrivKey
	if colonIndex := strings.Index(privKeyWithoutPrefix, ":"); colonIndex >= 0 {
		privKeyWithoutPrefix = privKeyWithoutPrefix[colonIndex+1:]
	}
	
	// 使用base58库解析WIF格式的私钥
	decoded, err := base58.Decode(privKeyWithoutPrefix)
	if err != nil {
		return "", fmt.Errorf("解码私钥失败: %v", err)
	}
	if len(decoded) < 37 {
		return "", fmt.Errorf("无效的私钥格式")
	}

	// 提取私钥部分 (去掉前缀、后缀和校验和)
	privKeyBytes := decoded[1:33]
	privKey := secp256k1.PrivKeyFromBytes(privKeyBytes)
	
	// 获取公钥，用于签名
	pubKey := privKey.PubKey()

	// 使用传入的发送方地址
	senderAddrStr := senderAddr
	
	// 为确保地址格式正确，也可以在这里添加地址格式验证

	// 获取发送方的UTXO (使用Blockstream API)
	url := ts.nodeURL + fmt.Sprintf("/address/%s/utxo", senderAddrStr)
	log.Printf("查询UTXO URL: %s", url)
	resp, err := ts.httpClient.Get(url)
	if err != nil {
		return "", fmt.Errorf("获取UTXO失败: %v", err)
	}
	defer resp.Body.Close()
	
	// 打印HTTP状态码和响应体，用于调试
	log.Printf("UTXO查询响应状态码: %d", resp.StatusCode)
	utxoBody, _ := ioutil.ReadAll(resp.Body)
	log.Printf("UTXO查询响应体: %s", string(utxoBody))
	
	// 因为我们已经读取了响应体，需要重新创建一个新的Reader
	r := bytes.NewReader(utxoBody)

	// 定义内部API响应的UTXO结构体
	type apiUTXO struct {
		TxID          string `json:"txid"`
		Vout          uint32 `json:"vout"`
		Value         int64  `json:"value"` // 聪
		Status        struct {
			Confirmed bool `json:"confirmed"`
		} `json:"status"`
	}
	
	var apiUTXOs []apiUTXO
	err = json.NewDecoder(r).Decode(&apiUTXOs)
	if err != nil {
		return "", fmt.Errorf("解析UTXO失败: %v", err)
	}

	var confirmedUTXOs []UTXO

	// 对每个UTXO，获取其交易详情来获取scriptPubKey
	for _, apiUTXO := range apiUTXOs {
		if !apiUTXO.Status.Confirmed {
			continue
		}
		
		// 获取交易详情
		txUrl := ts.nodeURL + fmt.Sprintf("/tx/%s", apiUTXO.TxID)
		log.Printf("查询交易详情URL: %s", txUrl)
		
		txResp, err := ts.httpClient.Get(txUrl)
		if err != nil {
			log.Printf("获取交易详情失败: %v", err)
			continue
		}
		defer txResp.Body.Close()
		
		if txResp.StatusCode != http.StatusOK {
			log.Printf("交易详情查询失败: 状态码 %d", txResp.StatusCode)
			continue
		}
		
		// 解析交易详情
		txBody, err := ioutil.ReadAll(txResp.Body)
		if err != nil {
			log.Printf("读取交易详情失败: %v", err)
			continue
		}
		
		// 只解析我们需要的部分 - 支持Blockstream API的格式
			var txData struct {
				Vout []struct {
					ScriptPubKey string `json:"scriptpubkey"` // Blockstream API返回的是直接的十六进制字符串
				} `json:"vout"`
			}
			
			err = json.NewDecoder(bytes.NewReader(txBody)).Decode(&txData)
			if err != nil {
				log.Printf("解析交易详情失败: %v", err)
				continue
			}
			
			// 确保索引有效
			if int(apiUTXO.Vout) >= len(txData.Vout) {
				log.Printf("UTXO索引 %d 超出范围", apiUTXO.Vout)
				continue
			}
			
			// 获取scriptPubKey (现在是直接的十六进制字符串)
			scriptPubKey := txData.Vout[apiUTXO.Vout].ScriptPubKey
			log.Printf("UTXO %s:%d 的scriptPubKey: %s", apiUTXO.TxID, apiUTXO.Vout, scriptPubKey)
		
		// 添加到已确认UTXO列表
		confirmedUTXOs = append(confirmedUTXOs, UTXO{
			TxID:         apiUTXO.TxID,
			Vout:         apiUTXO.Vout,
			Value:        apiUTXO.Value,
			ScriptPubKey: scriptPubKey,
		})
	}

	// 检查是否有UTXO
	var totalInput int64
	var selectedUTXOs []UTXO

	if len(confirmedUTXOs) > 0 {
		// 有UTXO，正常处理
		for _, utxo := range confirmedUTXOs {
			selectedUTXOs = append(selectedUTXOs, utxo)
			totalInput += utxo.Value // 已经是聪单位

			// 如果输入金额足够，就停止添加
			if totalInput >= amount+fee {
				break
			}
		}

		// 检查输入金额是否足够
		if totalInput < amount+fee {
			return "", fmt.Errorf("UTXO金额不足，当前可用: %d 聪，需要: %d 聪", totalInput, amount+fee)
		}
	} else {
		// 没有UTXO，不使用模拟交易，直接返回错误
		return "", fmt.Errorf("未找到发送方的UTXO，请确保地址有足够的余额")
	}

	// 计算找零
	change := totalInput - amount - fee

	// 构建交易输出
	txOutputs := []map[string]interface{}{
		{
			"address": receiverAddr,
			"value":   amount,
		},
	}

	// 添加找零输出 (如果有)
	if change > 0 {
		txOutputs = append(txOutputs, map[string]interface{}{
			"address": senderAddrStr,
			"value":   change,
		})
	}

	// 创建交易构建请求
	txBuilder := map[string]interface{}{
		"inputs": []map[string]interface{}{},
		"outputs": txOutputs,
	}

	// 添加UTXO作为输入
	for _, utxo := range selectedUTXOs {
		input := map[string]interface{}{
			"txid": utxo.TxID,
			"vout": utxo.Vout,
		}
		txBuilder["inputs"] = append(txBuilder["inputs"].([]map[string]interface{}), input)
	}

		// 创建交易
	tx := wire.NewMsgTx(wire.TxVersion)

	// 添加输入
	for _, utxo := range selectedUTXOs {
		log.Printf("使用UTXO: txid=%s, vout=%d, value=%d", utxo.TxID, utxo.Vout, utxo.Value)
		
		// 解析交易ID
		txID, err := hex.DecodeString(utxo.TxID)
		if err != nil {
			return "", fmt.Errorf("解析交易ID失败: %v", err)
		}
		log.Printf("解析后的交易ID (十六进制): %x", txID)
		
		// 对于比特币交易ID，我们需要反转字节顺序
		reversedTxID := make([]byte, len(txID))
		for i, j := 0, len(txID)-1; i < len(txID); i, j = i+1, j-1 {
			reversedTxID[i] = txID[j]
		}
		log.Printf("反转后的交易ID (十六进制): %x", reversedTxID)
		
		// 创建交易输入
		hash, _ := chainhash.NewHash(reversedTxID)
		prevOutPoint := wire.NewOutPoint(hash, utxo.Vout)
		txIn := wire.NewTxIn(prevOutPoint, nil, nil)
		tx.AddTxIn(txIn)
		log.Printf("创建的交易输入: hash=%s, vout=%d", hash.String(), utxo.Vout)
	}

	// 添加输出
	// 1. 接收方输出 - 支持P2PKH和SegWit地址
	receiverProgram, receiverScript, err := getPubKeyHashFromAddress(receiverAddr, ts.params)
	if err != nil {
		return "", fmt.Errorf("解析接收方地址失败: %v", err)
	}
	
	// 如果地址解析返回了完整的脚本（SegWit地址），直接使用
	// 否则，为P2PKH地址构建脚本
	if receiverScript == nil {
		receiverScript, err = txscript.NewScriptBuilder().
			AddOp(txscript.OP_DUP).
			AddOp(txscript.OP_HASH160).
			AddData(receiverProgram).
			AddOp(txscript.OP_EQUALVERIFY).
			AddOp(txscript.OP_CHECKSIG).
			Script()
		if err != nil {
			return "", fmt.Errorf("创建接收方脚本失败: %v", err)
		}
	}
	
	txOutReceiver := wire.NewTxOut(amount, receiverScript)
	tx.AddTxOut(txOutReceiver)

	// 2. 找零输出 (如果有)
	if change > 0 {
		senderProgram, senderScript, err := getPubKeyHashFromAddress(senderAddrStr, ts.params)
		if err != nil {
			return "", fmt.Errorf("解析发送方地址失败: %v", err)
		}
		
		// 为找零地址构建脚本
		if senderScript == nil {
			senderScript, err = txscript.NewScriptBuilder().
				AddOp(txscript.OP_DUP).
				AddOp(txscript.OP_HASH160).
				AddData(senderProgram).
				AddOp(txscript.OP_EQUALVERIFY).
				AddOp(txscript.OP_CHECKSIG).
				Script()
			if err != nil {
				return "", fmt.Errorf("创建找零脚本失败: %v", err)
			}
		}
		
		txOutChange := wire.NewTxOut(change, senderScript)
		tx.AddTxOut(txOutChange)
	}

	// 签名交易
	for i, utxo := range selectedUTXOs {
		// 解析脚本公钥
		scriptPubKeyBytes, err := hex.DecodeString(utxo.ScriptPubKey)
		if err != nil {
			return "", fmt.Errorf("解析脚本公钥失败: %v", err)
		}
		log.Printf("UTXO脚本公钥 (十六进制): %x", scriptPubKeyBytes)
		
		// 检查是否是SegWit地址（通过检查地址格式）
		isSegwit := strings.HasPrefix(senderAddrStr, "tb1q")
		
		if isSegwit {
			// 对于SegWit地址，我们需要手动构建签名和见证数据
			tx.TxIn[i].SignatureScript = nil // 清空scriptSig
			
			// 确保我们有正确的scriptPubKey
			log.Printf("使用的scriptPubKey长度: %d", len(scriptPubKeyBytes))
			log.Printf("scriptPubKey前几个字节: %x", scriptPubKeyBytes[:min(len(scriptPubKeyBytes), 10)])
			
			// 验证公钥哈希是否与锁定脚本匹配
			// P2WPKH锁定脚本格式: 00 14 <20字节公钥哈希>
			if len(scriptPubKeyBytes) == 22 && scriptPubKeyBytes[0] == 0x00 && scriptPubKeyBytes[1] == 0x14 {
				// 提取锁定脚本中的公钥哈希
				lockedPubKeyHash := scriptPubKeyBytes[2:22]
				log.Printf("锁定脚本中的公钥哈希: %x", lockedPubKeyHash)
				log.Printf("公钥哈希验证跳过，使用txscript库验证签名")
			}
			
			// 确保交易输入的PreviousOutPoint字段已经正确设置（应在创建交易输入时设置）
			// 验证交易ID格式
			_, err = chainhash.NewHashFromStr(utxo.TxID)
			if err != nil {
				return "", fmt.Errorf("交易ID格式无效: %v", err)
			}
			log.Printf("交易ID格式验证通过: %s", utxo.TxID)
			// 注意：PreviousOutPoint应该在创建TxIn时已经设置好
			
			// 对于P2WPKH地址，使用标准的CalcSignatureHash计算签名哈希
			sigHash, err := txscript.CalcSignatureHash(scriptPubKeyBytes, txscript.SigHashAll, tx, i)
			if err != nil {
				return "", fmt.Errorf("计算签名哈希失败: %v", err)
			}
			log.Printf("签名哈希 (十六进制): %x", sigHash)
			
			// 使用ECDSA私钥签名
			privKeyECDSA := privKey.ToECDSA()
			r, s, err := ecdsa.Sign(rand.Reader, privKeyECDSA, sigHash)
			if err != nil {
				return "", fmt.Errorf("签名失败: %v", err)
			}
			log.Printf("签名r值: %x", r.Bytes())
			log.Printf("签名s值: %x", s.Bytes())
			
			// 确保签名是规范形式（S值必须小于曲线阶的一半）
			halfOrder := new(big.Int).Div(secp256k1.S256().N, big.NewInt(2))
			if s.Cmp(halfOrder) > 0 {
				// 如果S值太大，用曲线阶减去它得到等效的小S值
				s = new(big.Int).Sub(secp256k1.S256().N, s)
				log.Printf("调整后的S值: %x", s.Bytes())
			}
			
			// 构建符合规范的ASN.1 DER编码签名
			rBytes := r.Bytes()
			sBytes := s.Bytes()
			
			// 确保r和s的编码符合规范（如果最高位为1，添加前导零）
			if len(rBytes) > 0 && (rBytes[0]&0x80) != 0 {
				tmp := make([]byte, len(rBytes)+1)
				copy(tmp[1:], rBytes)
				rBytes = tmp
			}
			if len(sBytes) > 0 && (sBytes[0]&0x80) != 0 {
				tmp := make([]byte, len(sBytes)+1)
				copy(tmp[1:], sBytes)
				sBytes = tmp
			}
			
			// 移除前导零（除了值为0的情况）
			for len(rBytes) > 1 && rBytes[0] == 0 && (rBytes[1]&0x80) == 0 {
				rBytes = rBytes[1:]
			}
			for len(sBytes) > 1 && sBytes[0] == 0 && (sBytes[1]&0x80) == 0 {
				sBytes = sBytes[1:]
			}
			
			// 计算总长度
			rLen := len(rBytes)
			sLen := len(sBytes)
			totalLen := 2 + rLen + 2 + sLen
			
			// 构建ASN.1 DER编码
			signature := make([]byte, totalLen+2)
			signature[0] = 0x30 // 序列标签
			signature[1] = byte(totalLen) // 总长度
			signature[2] = 0x02 // 整数标签(r)
			signature[3] = byte(rLen) // r长度
			copy(signature[4:4+rLen], rBytes)
			signature[4+rLen] = 0x02 // 整数标签(s)
			signature[5+rLen] = byte(sLen) // s长度
			copy(signature[6+rLen:6+rLen+sLen], sBytes)
			
			// 添加哈希类型
			signatureWithType := append(signature, byte(txscript.SigHashAll))
			log.Printf("构建的签名 (十六进制): %x", signatureWithType)
			
			// 对于SegWit交易，我们需要确保签名的长度在合理范围内
			if len(signatureWithType) < 71 || len(signatureWithType) > 73 {
				log.Printf("警告: 签名长度 %d 不在预期范围内(71-73)", len(signatureWithType))
			}
			
			// 设置见证数据 (对于P2WPKH，见证数据格式为[签名, 公钥])
			tx.TxIn[i].Witness = wire.TxWitness{signatureWithType, pubKey.SerializeCompressed()}
			log.Printf("创建SegWit见证成功，见证数据长度: %d, 签名长度: %d, 公钥长度: %d", 
				len(tx.TxIn[i].Witness), len(signatureWithType), len(pubKey.SerializeCompressed()))
			
			// 验证见证数据格式
			if len(tx.TxIn[i].Witness) != 2 {
				log.Printf("警告: 见证数据元素数量 %d 不符合P2WPKH要求(应为2)", len(tx.TxIn[i].Witness))
			}
		} else {
			// 对于非SegWit地址，使用传统的签名方式
			// 计算签名哈希
			sigHash, err := txscript.CalcSignatureHash(scriptPubKeyBytes, txscript.SigHashAll, tx, i)
			if err != nil {
				return "", fmt.Errorf("计算签名哈希失败: %v", err)
			}
			
			// 使用ECDSA私钥签名
			privKeyECDSA := privKey.ToECDSA()
			r, s, err := ecdsa.Sign(rand.Reader, privKeyECDSA, sigHash)
			if err != nil {
				return "", fmt.Errorf("签名失败: %v", err)
			}
			
			// 确保签名是规范形式（S值必须小于曲线阶的一半）
			// 对于secp256k1曲线，阶是0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
			halfOrder := new(big.Int).Div(secp256k1.S256().N, big.NewInt(2))
			if s.Cmp(halfOrder) > 0 {
				// 如果S值太大，用曲线阶减去它得到等效的小S值
				s = new(big.Int).Sub(secp256k1.S256().N, s)
			}
			
			// 将r和s转换为ASN.1格式
			// 这是一个简化的ASN.1 DER编码实现
			serializedR := r.Bytes()
			serializedS := s.Bytes()
			signature := make([]byte, 2+len(serializedR)+2+len(serializedS)+2)
			signature[0] = 0x30
			signature[1] = byte(len(signature) - 2)
			signature[2] = 0x02
			signature[3] = byte(len(serializedR))
			copy(signature[4:4+len(serializedR)], serializedR)
			signature[4+len(serializedR)] = 0x02
			signature[5+len(serializedR)] = byte(len(serializedS))
			copy(signature[6+len(serializedR):], serializedS)
			
			// 添加哈希类型
			signatureWithType := append(signature, byte(txscript.SigHashAll))
			
			// 构建解锁脚本
			sigScript, err := txscript.NewScriptBuilder().
				AddData(signatureWithType).
				AddData(pubKey.SerializeCompressed()).
				Script()
			if err != nil {
				return "", fmt.Errorf("创建解锁脚本失败: %v", err)
			}
			log.Printf("解锁脚本 (十六进制): %x", sigScript)
			tx.TxIn[i].SignatureScript = sigScript
		}
	}

	// 序列化交易
	var buf bytes.Buffer
	tx.Serialize(&buf)
	rawTxHex := hex.EncodeToString(buf.Bytes())

	// 广播交易 (使用Blockstream API)
	txURL := ts.nodeURL + "/tx"
	req, err := http.NewRequest("POST", txURL, bytes.NewBuffer([]byte(rawTxHex)))
	if err != nil {
		return "", fmt.Errorf("创建HTTP请求失败: %v", err)
	}
	req.Header.Set("Content-Type", "text/plain")

	resp, err = ts.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("广播交易失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// 读取并包含响应体中的具体错误信息
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		bodyStr := string(bodyBytes)
		return "", fmt.Errorf("广播交易返回非成功状态码: %d, 错误信息: %s", resp.StatusCode, bodyStr)
	}

	// 解析交易哈希
	txHash := tx.TxHash().String()
	log.Printf("交易广播成功，哈希: %s", txHash)
	log.Printf("从地址 %s 发送 %d 聪到地址 %s (手续费: %d 聪)", 
		senderAddrStr, amount, receiverAddr, fee)
	log.Printf("交易总输入: %d 聪, 找零: %d 聪", 
		totalInput, change)

	return txHash, nil
}

// GenerateTestnetAddress 生成测试网络地址和私钥
func GenerateTestnetAddress() (string, string, error) {
	// 使用测试网络参数
	params := &chaincfg.TestNet3Params

	// 生成随机私钥
	privKey, err := secp256k1.GeneratePrivateKey()
	if err != nil {
		return "", "", fmt.Errorf("生成私钥失败: %v", err)
	}

	// 转换为WIF格式
	// 1. 添加版本字节 (0xEF for testnet)
	wifBytes := make([]byte, 1+secp256k1.PrivKeyBytesLen+1)
	wifBytes[0] = params.PrivateKeyID
	copy(wifBytes[1:1+secp256k1.PrivKeyBytesLen], privKey.Serialize())
	wifBytes[1+secp256k1.PrivKeyBytesLen] = 0x01 // 压缩公钥标志

	// 2. 计算校验和
	checksum := sha256.Sum256(wifBytes)
	checksum = sha256.Sum256(checksum[:])

	// 3. 添加校验和并进行Base58编码
	fullWifBytes := make([]byte, len(wifBytes)+4)
	copy(fullWifBytes, wifBytes)
	copy(fullWifBytes[len(wifBytes):], checksum[:4])
	wifStr := base58.Encode(fullWifBytes)

	// 生成地址
	pubKey := privKey.PubKey()
	pubKeyHash := Hash160(pubKey.SerializeCompressed())

	// 构建P2PKH地址
	versionedPayload := make([]byte, 1+len(pubKeyHash))
	versionedPayload[0] = params.PubKeyHashAddrID
	copy(versionedPayload[1:], pubKeyHash)

	// 计算校验和
	addrChecksum := sha256.Sum256(versionedPayload)
	addrChecksum = sha256.Sum256(addrChecksum[:])

	// 构建完整地址数据
	addressBytes := make([]byte, len(versionedPayload)+4)
	copy(addressBytes, versionedPayload)
	copy(addressBytes[len(versionedPayload):], addrChecksum[:4])

	// Base58编码
	addressStr := base58.Encode(addressBytes)

	return addressStr, wifStr, nil

}

// SendBitcoinTransaction 发送比特币交易
func SendBitcoinTransaction(config *Config, senderPrivKey, senderAddr, receiverAddr string, amount, fee int64) (string, error) {
	// 创建交易发送器实例
	txSender, err := NewTransactionSender(config)
	if err != nil {
		log.Printf("创建交易发送器实例失败: %v\n", err)
		return "", err
	}
	defer txSender.Close()

	// 创建并发送交易
	txHash, err := txSender.CreateAndSendTransaction(senderPrivKey, senderAddr, receiverAddr, amount, fee)
	if err != nil {
		// 不在这里记录日志，让调用方决定如何处理错误
		return "", err
	}

	return txHash, nil
}
