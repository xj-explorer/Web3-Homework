// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Counter} from "./Counter.sol";
import {Test} from "forge-std/Test.sol";

contract CounterTest is Test {
  Counter counter;

  // “每个”测试函数执行之前都会调用 setUp 函数，用于初始化测试环境
  // 确保每个测试函数都在相同且干净的初始环境下运行
  // 避免测试之间的相互影响（测试隔离）
  function setUp() public {
    counter = new Counter();
  }

  // 触发了回滚即告测试失败
  function test_InitialValue() public view {
    require(counter.x() == 0, "Initial value should be 0");
  }

  function testFuzz_Inc(uint8 x) public {
    for (uint8 i = 0; i < x; i++) {
      counter.inc();
    }
    require(counter.x() == x, "Value after calling inc x times should be x");
  }

  function test_IncByZero() public {
    // 声明预期 counter.incBy(0) 会触发回滚
    // 如果 counter.incBy(0) 真的回滚了 → 测试通过
    // 如果 counter.incBy(0) 没有回滚 → 测试失败
    vm.expectRevert();
    counter.incBy(0);
  }
}
