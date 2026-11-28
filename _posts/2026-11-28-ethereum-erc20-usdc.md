---
title: "이더리움 토큰은 어떻게 움직일까? ERC-20과 USDC 컨트랙트 살펴보기"
date: 2026-11-28 00:00:00 +0900
categories: [tech-docs]
tags: [Ethereum, ERC-20, USDC, Solidity, Smart Contract]
---

&nbsp;&nbsp;여름 방학이 끝날 무렵 가상 자산과 관련한 특강을 들었었다. 하지만 비트코인이나 이더리움 같은 가상 자산이 어떤 원리로 작동하는지는 자세히 알지 못했다. 특히 이더리움에서 토큰이 어떻게 발행되고 전송되는지 궁금했다. 그래서 기초가 되는 거래 표준 규약부터 살펴보기로 했다.

## 1. ERC-20이란?

&nbsp;&nbsp;ERC-20은 이더리움에서 대체 가능한 토큰(Fungible Token)을 만들 때 사용하는 대표적인 표준 규약이다. 토큰이 공통된 함수와 이벤트를 제공하도록 정해 두었기 때문에 지갑이나 분산형 거래소 등 여러 애플리케이션에서 같은 방식으로 토큰을 다룰 수 있다.

&nbsp;&nbsp;ERC-20은 토큰의 이름이나 잔액을 조회하는 기능뿐만 아니라, 토큰을 직접 전송하거나 다른 계정이 대신 전송할 수 있도록 사용 권한을 설정하는 기능도 제공한다. 다음은 ERC-20의 주요 함수와 이벤트다.

### 주요 함수

- `name()`: 토큰의 이름을 반환한다.
- `symbol()`: 토큰의 기호를 반환한다.
- `decimals()`: 토큰의 소수 자릿수를 반환한다. 예를 들어 값이 `7`이라면 실제 표시 금액은 내부 정수 값을 `10^7`로 나누어 표현한다. 즉, 소수점 아래 7자리까지 표시할 수 있다는 뜻이다.
- `totalSupply()`: 현재 발행된 토큰의 총 공급량을 반환한다.
- `balanceOf(address owner)`: 지정한 주소가 보유한 토큰 잔액을 반환한다.
- `transfer(address to, uint256 value)`: 함수를 호출한 계정의 토큰 중 `value`만큼을 `to` 주소로 전송한다.
- `approve(address spender, uint256 value)`: `spender`가 호출자를 대신해 사용할 수 있는 토큰의 한도를 `value`로 설정한다.
- `allowance(address owner, address spender)`: `owner`가 `spender`에게 허용한 토큰 사용 한도 중 현재 남아 있는 양을 반환한다.
- `transferFrom(address from, address to, uint256 value)`: 호출자가 `from` 계정으로부터 허용받은 한도 내에서 `to` 주소로 토큰을 전송한다.

### 주요 이벤트

- `Transfer(address indexed from, address indexed to, uint256 value)`: 토큰 전송이 발생했을 때 기록되는 이벤트다. 0개의 토큰을 전송하는 경우에도 이벤트가 발생해야 한다.
- `Approval(address indexed owner, address indexed spender, uint256 value)`: 토큰 소유자가 다른 계정에 사용 권한을 설정하거나 변경했을 때 기록되는 이벤트다.

&nbsp;&nbsp;여기서 특히 눈에 띄었던 부분은 `approve()`와 `transferFrom()`이다. 단순히 토큰을 보내는 것 외에도 다른 계정이나 컨트랙트가 내 토큰을 사용할 수 있도록 권한을 설정할 수 있다는 점이 흥미로웠다.

&nbsp;&nbsp;ERC-20 표준의 제정 과정도 궁금해져 History에서 관련 자료를 찾아보았다. [레딧](https://www.reddit.com/r/ethereum/s/8iu5fpTE8H)에서 개발자들의 논의도 확인할 수 있었다. 토큰 표준이 처음부터 지금과 같은 형태로 정해진 것은 아니며, 개발자들의 논의와 제안을 거쳐 구체화되었다는 점을 알 수 있었다. 다만 초기 논의에서 사용된 표현이나 명칭이 현재의 표준으로 바뀐 정확한 경위는 제안서의 기록을 함께 확인할 필요가 있겠다.

## 2. 실제 활용 사례: USDC

&nbsp;&nbsp;표준 규약이 실제 토큰에서는 어떻게 구현되는지 알아보기 위해 [USDC Token](https://etherscan.io/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48#analytics)의 컨트랙트 코드를 살펴보았다.

&nbsp;&nbsp;처음에는 프록시 컨트랙트의 코드만 확인했지만, 프록시가 실제 기능을 수행하는 구현 컨트랙트로 연결된다는 점을 알게 되었다. 구현 컨트랙트로 이동해 [0x43..](https://etherscan.io/address/0x43506849D7C04F9138D1A2050bbF3A0c054402dd#code) 주소의 `FiatTokenV2_2` 컨트랙트도 살펴보았다.

&nbsp;&nbsp;`approve()`와 `transferFrom()`은 실제 구현 코드에도 존재했다. 두 함수가 어떻게 연결되는지 살펴보면서, 은행 간 거래처럼 승인과 실제 자금 이동이 별도의 단계로 처리되는 것인지 궁금해졌다.

&nbsp;&nbsp;이더리움에서는 다음과 같은 순서로 동작한다.

1. **사용 권한 설정**: 토큰 소유자가 `approve()`를 호출해 특정 주소가 사용할 수 있는 토큰의 한도를 설정한다.
2. **토큰 전송 요청**: 권한을 부여받은 주소가 `transferFrom()`을 호출해 토큰 전송을 요청한다.
3. **잔액 및 사용 한도 갱신**: 트랜잭션이 성공하면 해당 실행 과정에서 보내는 계정과 받는 계정의 잔액이 갱신되고, 사용한 만큼 허용 한도도 감소한다.

&nbsp;&nbsp;즉, `approve()`는 토큰을 실제로 이동시키는 함수가 아니라 다른 계정이 토큰을 사용할 수 있도록 권한을 설정하는 함수다. 반면 `transferFrom()`은 설정된 권한을 이용해 실제 토큰을 전송한다. 은행의 정산 절차와 완전히 같은 방식은 아니며, 이더리움에서는 트랜잭션이 블록에 포함되어 성공적으로 실행되는 과정에서 상태가 갱신된다.

## 3. uint256과 오버플로 방지

&nbsp;&nbsp;코드를 더 살펴보다가 또 다른 궁금증이 생겼다. ERC-20에서 토큰의 수량을 표현할 때 사용하는 `uint256`은 256비트 부호 없는 정수다. 그렇다면 표현할 수 있는 최댓값인 (2^{256}-1)보다 큰 값이 입력되면 어떻게 될까?

&nbsp;&nbsp;이런 상황을 정수 오버플로(Integer Overflow)라고 한다. 오버플로가 발생하면 연산 결과가 표현 가능한 범위를 넘어가 잘못된 값으로 처리될 수 있다. USDC의 구현 코드를 살펴보니 OpenZeppelin의 `SafeMath` 라이브러리를 사용하고 있었다.

&nbsp;&nbsp;`SafeMath`는 덧셈이나 뺄셈 등의 연산 결과가 `uint256`의 표현 범위를 벗어나는 경우 트랜잭션을 실패시키는 방식으로 오버플로와 언더플로를 방지한다. 실제 USDC 코드에서는 `FiatTokenV1`에서 `SafeMath`를 가져오고, `using SafeMath for uint256;`을 선언해 사용하고 있었다. `FiatTokenV2_2`는 이 컨트랙트를 상속하는 구조다.

다음은 코드에서 확인할 수 있는 사용 방식이다.

```solidity
using SafeMath for uint256;

_balanceOf(to).add(value); // 잔액을 더할 때 사용
```

&nbsp;&nbsp;참고로 USDC 코드가 사용하는 Solidity 0.6.12에서는 이런 방식의 오버플로 방지 라이브러리가 중요하다. Solidity 0.8 버전부터는 정수 연산의 오버플로와 언더플로를 기본적으로 검사하므로, 일반적인 산술 연산에서 별도의 `SafeMath`를 사용하지 않아도 된다.

## 4. 마무리

&nbsp;&nbsp;이번에 ERC-20 표준과 USDC의 실제 컨트랙트 코드를 살펴보면서, 이더리움의 토큰은 단순히 숫자를 주고받는 것이 아니라 정해진 함수와 권한에 따라 동작한다는 점을 알게 되었다. 특히 `approve()`와 `transferFrom()`의 관계를 통해 토큰을 직접 전송하는 방식과 다른 계정에 전송 권한을 부여하는 방식의 차이를 이해할 수 있었다.

&nbsp;&nbsp;또한 실제 서비스에서 사용되는 컨트랙트는 표준 규약의 함수만 구현하는 것이 아니라, 상속 구조나 권한 관리, 오버플로 방지 등 다양한 요소를 함께 고려한다는 점도 확인할 수 있었다. 앞으로는 ERC-20을 바탕으로 다른 토큰 표준과 스마트 컨트랙트의 보안 취약점도 살펴보고 싶다.

## 참고 자료

<div style="border: 1px solid #d9e2ee; border-radius: 8px; padding: 14px 18px; margin: 12px 0;">
  <p style="margin: 4px 0;"><a href="https://eips.ethereum.org/EIPS/eip-20">1. EIP-20: Token Standard</a></p>
  <p style="margin: 4px 0;"><a href="https://github.com/circlefin/stablecoin-evm/blob/master/contracts/v2/FiatTokenV2_2.sol">2. Circle - FiatTokenV2_2.sol</a></p>
  <p style="margin: 4px 0;"><a href="https://ercs.ethereum.org/ERCS/erc-2612">3. ERC-2612: Permit Extension for ERC-20</a></p>
</div>
