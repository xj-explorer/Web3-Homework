package utils

func Merge(intervals [][]int) [][]int {
    result := make([][]int, 0)
    mergedArr := make([]int,2)
    for i:=0; i<len(intervals); i++ {
        tempArr := intervals[i]
        if (mergedArr[0] == intervals[i][0]) && (mergedArr[1] == intervals[i][1]) {
            continue
        }
        for j:=len(intervals)-1; j>i; j-- {
            if (tempArr[0] >= intervals[j][0] && tempArr[0] <= intervals[j][1]) && (tempArr[1] >= intervals[j][0] && tempArr[1] <= intervals[j][1]) {
                tempArr[0] = intervals[j][0]
                tempArr[1] = intervals[j][1]
                mergedArr = intervals[j]
            } else if tempArr[0] < intervals[j][0] && (tempArr[1] >= intervals[j][0] && tempArr[1] <= intervals[j][1]) {
                tempArr[1] = intervals[j][1]
                mergedArr = intervals[j]
            } else if tempArr[1] > intervals[j][1] && (tempArr[0] >= intervals[j][0] && tempArr[0] <= intervals[j][1]) {
                tempArr[0] = intervals[j][0]
                mergedArr = intervals[j]
            } else {
                mergedArr = make([]int,2)
            }
        }
        result = append(result,tempArr)
    }
    return result
}