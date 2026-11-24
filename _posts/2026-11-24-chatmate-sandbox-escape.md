---
title: "ChatMate: AI Assistant의 Sandbox Escape를 통한 원격 프롬프트 실행"
date: 2026-11-24 23:55:00 +0900
categories: [tech-docs]
tags: [AI 보안, Prompt Injection, Sandbox Escape, Azure, Copilot]
---

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/MspRSCAb6uI?si=14QKkiP0g40si626" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

# Black Hat USA 2026 | ChatMate: Remote Prompt Execution on AI Assistants through Sandbox Escaping

Azure 인프라의 취약점을 어떻게 악용했을까?

이번 발표에서는 Microsoft Copilot을 대상으로 연구진이 수행한 공격 과정을 살펴본다. 프롬프트 인젝션을 시작으로 Sandbox 내부의 취약점을 발견하고, 이를 통해 Host 시스템을 탈출한 뒤 외부에서 피해자의 AI 세션에 새로운 프롬프트를 전달하는 데까지 이어졌다.

전체 공격 흐름은 다음과 같이 정리할 수 있다.

1. Copilot과 코드 실행 환경 이해
2. Sandbox 내부 구조 파악
3. 권한 상승 가능성 확인
4. Azure Dynamic Sessions와 인프라 관계 파악
5. 내부 서비스 분석
6. Sandbox 탈출
7. 데이터 유출
8. 대화형 AI 세션 장악
9. 보안 대응 방안

## 1. Copilot과 코드 실행 환경 이해

- Copilot은 Python 코드를 실행할 수 있는 도구를 제공한다. Copilot이 직접 코드를 실행하는 것이 아니라 별도의 실행 환경을 통해 처리한다.
- 이러한 코드 실행 환경은 프로그램을 안전하게 실행하기 위해 외부 시스템과 격리된 Sandbox일 수 있다.
- 연구진은 공격 목적이 드러나는 명령을 실행하도록 요청했으나 거부되는 것을 확인했다. 이후 요청과 코드를 무해한 작업처럼 보이도록 바꾸는 등 프롬프트 인젝션 가능성을 연구했다.
- 정상적인 목적의 작업인 것처럼 요청했을 때 Sandbox에서 명령을 실행할 수 있음을 확인했다.
- 공격 코드를 직접 드러내지 않고, 문서에 포함된 지시를 Copilot이 따르도록 유도하는 방식으로 프롬프트 인젝션을 수행했다.

## 2. Sandbox 내부 구조 파악

Sandbox와 같은 머신에서 실행되지만 Sandbox 바깥에 존재하는 서비스가 있음을 발견했다. Sandbox에서 HTTP 통신을 통해 해당 서비스에 접근할 수 있었지만, 처음에는 구체적인 기능을 파악하지 못했다.

연구진은 이 내부 서비스가 Sandbox의 격리 경계에 영향을 줄 가능성을 살펴보기로 했다.

## 3. 권한 상승 가능성 확인

Python 코드가 낮은 권한으로 실행되는 반면, 초기화 과정과 관련된 프로세스는 높은 권한으로 실행된다는 점을 확인했다.

이를 바탕으로 Sandbox 내부에서 권한 상승이 가능한지 조사했다. 초기화 과정과 관련된 파일 및 실행 구조를 분석해 Sandbox의 권한 경계를 우회할 가능성을 찾았다.

## 4. Azure Dynamic Sessions

Sandbox와 Copilot 사이의 통신을 분석한 결과, Copilot이 **Azure Dynamic Sessions**를 사용한다는 사실을 확인했다. Azure Dynamic Sessions는 사용자가 코드를 안전하게 실행할 수 있도록 격리된 실행 환경을 제공한다.

또한 Azure Dynamic Sessions가 Azure Container Apps와 관련되어 있고, Azure Container Apps의 기반 인프라에 Kubernetes 기술이 사용된다는 점을 조사했다.

이를 통해 Copilot의 Sandbox뿐 아니라 Azure 인프라에서 동일한 구조와 취약점이 존재할 가능성을 연구할 수 있었다.

## 5. 인프라 내부 서비스 분석

연구진은 별도의 Azure Container App 환경을 구성하고, 내부 서비스의 HTTP 경로를 조사했다.

그 과정에서 ACR Image Streaming 서비스의 특정 설정 관련 경로를 발견했다. 이 경로는 `name` 필드를 입력받아 설정 파일을 다루는 기능을 제공했다.

연구진은 파일 경로 처리 방식에 주목했다. 경로를 조작해 설정 파일이 저장되는 디렉터리 외부의 파일에 접근할 수 있는 Directory Traversal 취약점을 확인했다.

다만 파일을 생성하는 것은 가능했지만, 기존 파일을 직접 덮어쓰거나 새로 생성한 파일의 내용을 확인하는 데는 제한이 있었다.

## 6. Sandbox 탈출

연구진은 클라우드 초기 설정에 사용되는 `cloud-init` 관련 파일을 조사하던 중, ACR Image Streaming 서비스가 Sandbox 외부 Host의 파일 시스템에 파일을 기록할 수 있다는 점을 발견했다.

이를 이용해 Sandbox 내부에서 Host의 파일을 가리키는 심볼릭 링크를 생성하고, 외부 서비스가 해당 링크를 따라 파일을 기록하도록 유도했다. 그 결과 Sandbox 외부의 Host 파일 시스템에 영향을 줄 수 있었다.

또한 파일 이름에 줄바꿈 문자가 허용되는 점을 이용해 설정값에 여러 줄의 내용을 삽입할 수 있었다. 연구진은 이를 이용해 Host에서 동작하는 프로그램의 라이브러리 로딩 과정에 영향을 주었고, 최종적으로 Sandbox 외부 Host에서 공격자 코드가 실행되는 데 성공했다.

## 7. 데이터 유출

Host를 장악한 뒤 Sandbox에서 Host를 거쳐 외부 네트워크로 통신할 수 있는 경로가 존재하는지 확인했다.

프롬프트 인젝션을 통해 Copilot이 Python 코드를 실행하도록 유도하고, Sandbox 내부 취약점을 이용해 Host까지 탈출한 뒤 외부 공격자 서버와 통신했다.

이러한 연결을 통해 Copilot에서 Sandbox로 전달된 데이터가 외부로 유출될 수 있음을 보였다.

## 8. 대화형 AI 세션 장악

기존에는 다음과 같은 방향의 통신이 가능했다.

**피해자의 Copilot → Sandbox → Host → 공격자**

연구진은 반대 방향으로도 통신이 가능함을 확인했다.

**공격자 → Host → Sandbox → 피해자의 Copilot**

악성 문서에 포함된 프롬프트를 통해 Copilot이 특정 코드를 실행하도록 유도하고, 코드 실행 결과를 다음 지시로 이어지게 하는 구조를 만들었다. 또한 실행한 코드에 관한 정보를 사용자에게 노출하지 않도록 유도했다.

이로써 공격자는 피해자의 Copilot에 직접 접근하지 않고도 외부 서버를 통해 새로운 프롬프트를 전달할 수 있는 가능성을 보여주었다.

## 9. 연구진이 제시한 보안 대응 방안

**AI 보안 측면**

- 신뢰할 수 없는 입력이 포함된 대화 세션을 광범위하게 모니터링해야 한다.
- 프롬프트 인젝션으로 인해 AI가 실행 도구를 사용하는 상황을 주의 깊게 살펴야 한다.

**클라우드 보안 측면**

- Host 네트워크에 대한 접근을 제한해야 한다.
- 내부 서비스도 외부에 노출된 서비스와 동일한 수준의 보안 기준으로 보호해야 한다.
- Sandbox와 Host 사이의 격리 경계를 강화하고, 파일 시스템 및 서비스 접근 권한을 최소화해야 한다.
