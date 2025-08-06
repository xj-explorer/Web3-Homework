package utils

// 计算两个int类型的最小值
func MinInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// 计算两个int类型最大的值
func maxInt(a, b int) int {
    if a > b {
        return a
    }
    return b
}

// 判断一个int数是否在数组中
func IsInclude(numbers []int, target int) bool {
    for _, num := range numbers {
        if num == target {
            return true
        }
    }
    return false
}