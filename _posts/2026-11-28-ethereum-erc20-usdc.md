---
title: "ERC-20과 USDC 컨트랙트 살펴보기"
date: 2026-11-28 00:00:00 +0900
categories: [tech-docs]
---

여름 방학이 끝날 무렵 가상 자산과 관련한 특강을 들었었다. 하지만 이더리움과 같은 가상 자산의 실행 원리를 자세히는 잘 알 수 없었다. 이더리움이 어떻게 작동되는지 그 원리가 궁금해서 기초 거래 표준 규약부터 알아보기로 했다.

## 목적과 핵심 내용

 현재 이더리움에 사용되고 있는 거래 표준 규약 중 하나이다. 토큰 표준이라고 불리는 ERC-20이 이더리움의 모든 토큰을 지갑부터 분산형 거래소까지 다른 애플리케이션에서 재사용할 수 있도록 만들었다. 토큰을 전송하는 기본 기능을 제공할 뿐만 아니라 토큰을 승인하여 제3자가 사용할 수 있도록 허용한다. 다음은 ERC-20의 구동 코드이고 이를 살짝 소개해보겠다. 

* 'function name() public view returns (string)'으로 **토큰 이름**을 반환한다.
* 'function symbol() public view returns (string)'은 **토큰의 기호**를 반환한다.
*'function decimals() public view returns (uint8)'은 토큰이 사용하는 **소수 자릿수**를 반환한다. 예를 들어 '7'이라면 토큰 금액을 '10^7'으로 나누는 것을 의미한다.
* 'function totalSupply() public view returns (uint256)'은 **총 토큰 공급량**을 반환한다.
* 'function balanceOf(address _owner) public view returns (uint256 balance)'은 주소가 있는 **다른 계정의 계정 잔액**을 반환한다.
* 'function transfer(address _to, uint256 _value) public returns (bool success)'은 '_value'라는 처리할 토큰을 '_to'로 옮긴다. 
* 'function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)'은 바로 위 코드와 동작이 비슷하지만 차이가 있다. 계약이 사용자를 대신하여 토큰을 전송하거나 통화로 수수료를 부과하도록 허용하는데 사용될 수 있다. 
* 'function approve(address _spender, uint256 _value) public returns (bool success)'은 계좌에서 '_value'의 양에 따라 여러 번 인출할 수 있음을 나타낸다.
* 'function allowance(address _owner, address _spender) public view returns (uint256 remaining)'은 **'_spender'의 금액을 반환**한다.
* 'event Transfer(address indexed _from, address indexed _to, uint256 _value)'은 0값 전송을 포함해서 **토큰이 전송될 때마다** 실행된다.
* 'event Approval(address indexed _owner, address indexed _spender, uint256 _value)'은 **성공적으로 호출**되었다면 실행된다.

 History에서 관련된 링크를 열어보았다. 레딧은 페이지 열기가 가능하길래 한 번 봤다. [레딧](https://www.reddit.com/r/ethereum/s/8iu5fpTE8H)에서 개발자들이 이야기 한 걸 토대로 만들어진 거겠지? 처음엔 Token이 아니라 Coin이라는 말로 통일되어 있었다고 한다. 하긴 Coin이면 비트코인만 지칭하는 것 같긴 하다.

## 실제 활용 사례: USDC

 USD Coin(USDC)([USDC Token](https://etherscan.io/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48#analytics))의 컨트랙트 코드를 살펴보았다. 처음에는 프록시 컨트랙트의 코드만 확인했지만, 다른 컨트랙트로 이동해서 실제 구현 코드도 확인할 수 있었다. 이 과정에서 
[0x43506849D7C04F9138D1A2050bbF3A0c054402dd](https://etherscan.io/address/0x43506849D7C04F9138D1A2050bbF3A0c054402dd#code)주소의 FiatTokenV2_2 컨트랙트를 살펴보았다. 

 approve()와 transferFrom()과 같은 함수는 따로 존재했다. 우리나라에서도 각각의 거래는 각 은행마다 진행되지만 실제 자금의 이동은 자정 무렵 한국 은행을 통해서니까 이처럼 실행되는 것일까? 이러한 궁금증을 안고 살펴보았다. 이더리움에서는 'transfer()'나 'transferFrom()' 트랜잭션이 블록에 포함되어 성공하면 해당 트랜잭션 안에서 토큰 잔액이 갱신된다. 따라서 'approve()'는 토큰을 사용할 수 있는 권한을 미리 설정하고, 'transferFrom()'은 그 권한을 이용해 실제 토큰을 전송한다. 
 또 코드를 살펴보다가 궁금증이 생겼다. 'uint256 _value'를 사용하고 있다면 이보다 더 큰 수(2^256-1보다 더 큰 수)를 받게 된다면 오버플로가 발생할 수도 있는데 이 가능성은 어떻게 차단하고 있을까? 실제 구현에서는 OpenZeppelin의 'SafeMath'를 사용하고 있음을 알게 됐다. 'SafeMath'는 연산 결과가 표현 가능한 범위를 초과하면 트랜잭션을 실패시키기 때문에 값이 순환하는 오버플로를 방지한다. 다음은 solidity에서의 사용 예시이다.

```solidity
using SafeMath for uint256;
_balanceOf(to).add(value) //잔액을 더할 때 사용
```

## 참고 자료

<div style="border: 1px solid #d9e2ee; border-radius: 8px; padding: 14px 18px; margin: 12px 0;">
  <p style="margin: 4px 0;"><a href="https://eips.ethereum.org/EIPS/eip-20">https://eips.ethereum.org/EIPS/eip-20</a></p>
  <p style="margin: 4px 0;"><a href="https://github.com/circlefin/stablecoin-evm/blob/master/contracts/v2/FiatTokenV2_2.sol">https://github.com/circlefin/stablecoin-evm/blob/master/contracts/v2/FiatTokenV2_2.sol</a></p>
  <p style="margin: 4px 0;"><a href="https://ercs.ethereum.org/ERCS/erc-2612">https://ercs.ethereum.org/ERCS/erc-2612</a></p>
</div>
