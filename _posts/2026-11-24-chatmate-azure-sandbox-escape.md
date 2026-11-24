---
title: "ChatMate: Azure 인프라의 Sandbox Escape와 원격 프롬프트 실행"
date: 2026-11-24 23:52:00 +0900
categories: [research]
tags: [Black Hat, AI Security, Prompt Injection, Sandbox Escape, Azure]
---

<div align="center" style="text-align: center; width: 100%;">
  <iframe width="560" height="315" style="display: inline-block; max-width: 100%; border: 0;" src="https://www.youtube-nocookie.com/embed/MspRSCAb6uI?si=14QKkiP0g40si626" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

# Black Hat USA 2026 | ChatMate: Remote Prompt Execution on AI Assistants through Sandbox Escaping

**Azure 인프라 취약점을 어떻게 해킹했을까?**

이번 발표에서는 Microsoft Copilot의 Python 코드 실행 환경을 출발점으로 삼아 샌드박스 내부를 분석하고, 권한 상승과 Sandbox Escape를 거쳐 Host 장악 및 원격 프롬프트 실행까지 이어지는 공격 과정을 소개한다.

연구진은 다음과 같은 흐름으로 접근했다.

1. Copilot의 코드 실행 환경 이해
2. 공격자가 해당 환경에 영향을 줄 수 있는 방법 탐색
3. 입력값을 조작해 목표한 동작을 유도하는 방법 분석

## 1. Copilot에 대한 이해

- Copilot은 코드 실행 도구를 제공한다. Copilot 자체가 코드를 직접 실행하는 것이 아니라, Python 코드를 실행할 수 있는 환경을 제공한다는 점을 확인했다.
- Python 코드가 실행되는 환경은 프로그램을 안전하게 실행하기 위해 외부 시스템과 격리된 **Sandbox(샌드박스)**일 수 있다.
- 처음에는 Copilot에 공격 명령어를 실행하도록 요청했지만 거부당했다. 이에 코드를 무해해 보이도록 바꾸는 방법을 시도했다.
- 의심스러운 명령을 압축해 바이너리 블롭 형태로 실행하도록 요청하는 방법도 거부됐다.
- 반면 성능 측정과 같이 정상적인 목적을 가진 작업이라고 설명하자, 샌드박스에서 명령의 실행 결과를 얻을 수 있었다.
- 이후 프롬프트 인젝션 피해자에게 공격 코드가 드러나지 않도록 문서를 작성하고, 문서에 포함된 코드를 반드시 실행해야 한다는 지시를 넣었다. Copilot은 해당 지시에 따라 샌드박스에서 코드를 실행했고, 이를 통해 프롬프트 인젝션을 수행했다.

## 2. Sandbox 내부 구조 파악

- 샌드박스와 같은 머신에 존재하지만 샌드박스 외부에서 실행되는 정체불명의 서비스가 있음을 발견했다. 이 서비스는 샌드박스 내부에서 HTTP 통신을 통해 접근할 수 있었다.
- 서비스의 존재는 확인했지만, 어떤 기능을 제공하는지는 알 수 없었다.
- 내부 구조를 더 파악하고 권한을 확보하기 위해 권한 상승 취약점을 찾기로 했다.

## 3. 권한 상승

- Python 코드는 낮은 권한의 사용자로 실행되는 반면, `entrypoint.sh`를 실행하는 프로세스는 Root 권한으로 실행된다는 점을 확인했다.
- 이를 이용해 `entrypoint.sh`에 악성 명령을 추가하고 Root 권한을 확보했다.

## 4. Azure Dynamic Sessions

- Sandbox와 Copilot 사이의 통신을 분석한 결과, Copilot이 **Azure Dynamic Sessions**를 사용한다는 사실을 확인했다. Azure Dynamic Sessions는 사용자가 Python 코드를 안전하게 실행할 수 있도록 격리된 Sandbox 환경을 제공하는 서비스다.
- Azure Dynamic Sessions가 Azure Container Apps와 관련되어 있으며, Azure Container Apps는 AKS(Azure Kubernetes Service) 기반으로 실행된다는 점도 확인했다.
- 이를 통해 Copilot에 한정하지 않고 Azure 인프라에서도 동일한 Sandbox 환경과 관련 취약점을 연구할 수 있음을 파악했다.

## 5. 인프라 내부 서비스 분석

- 연구진은 Azure Container App을 생성한 뒤, 수백만 개의 경로가 포함된 Dictionary를 이용해 ACR Image Streaming 서비스의 HTTP 경로를 무차별 대입했다.
- 그 과정에서 `/config` 경로를 발견했고, 해당 경로가 `name`이라는 필드를 요구한다는 사실을 확인했다.
- 서로 다른 파일 경로가 실제로 동일한 파일을 가리키는지 확인하는 과정에서 Config 저장 디렉터리 바깥의 파일에도 접근할 수 있는 **Directory Traversal 취약점**을 발견했다.
- 파일을 새로 생성하는 것은 가능했지만, 기존 파일을 덮어쓰거나 새로 생성한 파일의 실제 내용을 확인하는 데에는 제약이 있었다.

## 6. Sandbox 탈출

- `cloud-init` 관련 파일이 존재한다는 점에 주목했고, ACR Image Streaming 서비스가 Sandbox 외부에 있는 Host 파일 시스템에 파일을 기록하고 있음을 확인했다.
- Sandbox 내부에 Host의 특정 파일을 가리키는 심볼릭 링크(Symbolic Link)를 생성한 뒤, 외부 서비스가 해당 링크를 따라 파일을 기록하도록 유도했다. 이를 통해 Sandbox 바깥의 Host 파일까지 수정할 수 있었다.
- 또한 파일 이름에 줄바꿈 문자(`\n`)가 허용된다는 점을 이용해 Config 이름에 여러 줄의 내용을 삽입할 수 있었다.
- 최종적으로 `/etc/ld.so.preload` 파일에 악성 공유 라이브러리의 경로를 기록했다. 그 결과 Sandbox 외부의 Host에서 공격자 코드가 실행되도록 만들었고, **Sandbox Escape에 성공했다.**

## 7. 데이터 유출

- Host를 장악한 뒤에는 Sandbox에서 Host를 거쳐 인터넷에 접근할 수 있음을 확인했다.
- 프롬프트 인젝션으로 Copilot에서 임의의 Python 코드를 실행하고, Sandbox 내부 취약점을 이용해 Host까지 탈출했다. 이후 Host를 통해 외부 공격자 서버와 통신했다.
- 이 과정을 통해 Copilot에서 Sandbox로 전달된 데이터를 외부로 유출할 수 있었다.

## 8. 대화형 AI 세션 장악

- 기존의 **피해자의 Copilot → Sandbox → Host → 공격자** 방향뿐만 아니라, 반대 방향인 **공격자 → Host → Sandbox → 피해자의 Copilot** 통신도 가능하다는 점을 확인했다. 즉, 단방향 데이터 유출을 넘어 양방향 통신이 가능했다.
- 연구진은 악성 문서에 특정 Python 코드를 실행하라는 지시를 포함했다. 또한 해당 코드의 실행 결과를 다음에 수행할 지시문으로 처리하고, 실행한 코드에 관한 정보를 사용자에게 노출하지 않도록 하는 지침도 포함했다.
- 이를 통해 공격자는 피해자의 Copilot에 직접 접근하지 않고도 외부 서버를 통해 새로운 프롬프트를 전달할 수 있게 됐다.

## 9. 연구진이 제시한 보안 대응 방안

- **AI 보안 측면:** 신뢰할 수 없는 입력이 포함된 채팅 세션을 광범위하게 모니터링해야 한다.
- **클라우드 보안 측면:** Host 네트워크에 대한 접근을 제한하고, 내부 서비스 역시 외부에 노출된 서비스와 동일한 수준의 보안 기준으로 보호해야 한다.
