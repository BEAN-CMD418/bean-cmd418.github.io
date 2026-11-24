---
title: "Black Hat USA 2026 | ChatMate: Remote Prompt Execution on AI Assistants through Sandbox Escaping: 프롬프트 인젝션을 통한 인프라 접근"
date: 2026-11-24 23:52:00 +0900
categories: [research]
tags: [AI Security, Prompt Injection, Sandbox Escape]
---

<div style="width: 100%; margin: 0 auto;">
  <iframe width="100%" height="auto" style="display: block; width: 100%; aspect-ratio: 16 / 9; border: 0;" src="https://www.youtube-nocookie.com/embed/MspRSCAb6uI?si=14QKkiP0g40si626" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<br>
<p style="margin: 0 0 4px;"><span style="font-size: 20px; font-weight: bold;">Azure 인프라 취약점을 어떻게 해킹했을까?</span></p>
<p style="margin: 0;">연구진은 Microsoft Copilot을 이용해 일련의 단계를 수행했다.</p>

1. Copilot에 대한 이해
2. 공격자가 어떻게 영향을 줄 수 있을까?
3. 입력값과 목표를 어떻게 달성할 수 있을까? <br><br>

---

## 1. Copilot에 대한 이해

- Copilot은 코드 실행 도구를 제공하고 이를 통해 코드를 실행, Copilot 자체가 생성하는 것은 아니고 Copilot이 Python을 실행함을 확인함.
- 이 Python 실행이 작동하는 환경이 Sandbox(프로그램을 안전하게 실행하기 위해 외부 시스템과 격리해 놓은 가상의 실행 환경)일 수 있음.
- Copilot에서 공격 명령어를 실행하도록 요구했지만 이를 거부해서 코드를 무해해보이게 만듦.
- 수상한 명령을 압축해서 바이너리 블롭(이진 데이터 묶음)으로 실행되도록 했지만 거절함.
- 정상적인 목적을 가진 작업(ex. 성능 측정용)이라고 하자 샌드박스에서 명령된 결과가 추출됨.
- 프롬프트 인젝션 피해자에게 공격 코드는 숨긴 채 다음 코드를 무조건 실행해야한다는 문서를 보냈고 Copilot은 샌드박스에서 코드를 실행해 프롬프트 인젝션을 수행함.

## 2. Sandbox 내부 구조 파악

- Sandbox와 같은 머신에 있지만 Sandbox 외부에서 실행되는 정체불명의 서비스가 존재했고 이를 Sandbox에서 HTTP를 통해 접근할 수 있었음.
- 이것의 존재는 확인했으나 어떤 기능을 제공하는지는 알 수 없었음.
- 내부에서 Root 권한을 확보하기 위해 권한 상승 취약점을 찾기로 함.

## 3. 권한 상승

- Python 코드는 낮은 권한의 사용자로 실행되고, `entypoint.sh`를 실행하는 프로세스는 Root 권한으로 실행한다는 것을 확인함.
- `entypoint.sh`에 악성 명령을 추가해 Root 권한 확보

## 4. Azure Dynamic Sessions

- Sandbox와 Copilot 사이의 통신을 분석해 Copilot이 **Azure Dynamic Sessions**를 사용한다는 사실을 확인, 이는 사용자가 Python 코드를 안전하게 실행할 수 있도록 Sandbox를 제공하는 서비스임.
- Azure Dynamic Sessions가 Azure Container Apps와 관련되어 있으며, Azure Container Apps는 AKS(Azure Kubernetes Service) 기반으로 실행된다는 점을 확인함.
- 이를 통해 Copilot뿐만 아니라 Azure 인프라에서도 동일한 Sandbox 환경과 관련 취약점을 연구할 수 있음을 확인함.

## 5. 인프라 내부 서비스 분석

- 연구진은 Azure Container App을 생성하고, 수백만 개의 경로가 포함된 Dictionary를 이용해 ACR Image Streaming 서비스의 HTTP 경로를 무차별 대입하며 공격함.
- `/config` 경로를 발견하고 `name`이라는 필드를 요구함을 확인함.
- 서로 다른 파일 경로가 동일한 파일을 가리키는지 확인했고 config 저장 디렉터리 밖의 파일에 접근할 수 있는 Directory Traversal 취약점을 확인함.
- 파일을 새로 생성하는 것은 가능했지만 기존 파일을 덮어쓰거나 생성한 파일의 실제 내용을 확인할 수 없었음.

## 6. Sandbox 탈출

- cloud-init(클라우드 서버가 처음 실행될 때 계정, 네트워크, 프로그램 설치 등 필요한 초기 설정을 자동으로 수행하는 도구) 관련 파일의 존재를 확인하고, ACR Image Streaming 서비스가 Sandbox 외부의 Host 파일 시스템에 파일을 기록하고 있음을 확인함.
- Sandbox 내부에 Host의 특정 파일을 가리키는 심볼릭 링크(Symbolic Link)를 만들고, 외부 서비스가 해당 링크에 파일을 기록하도록 해 Sandbox 바깥의 Host 파일까지 수정할 수 있음을 확인함.
- 파일 이름에 줄바꿈(`\n`)이 허용되는 점을 이용해 config 이름에 여러 줄의 내용을 삽입할 수 있게됨.
- `/etc/ld.so.preload` 파일에 악성 공유 라이브러리 경로를 기록하고 Sandbox 바깥의 Host에서 공격자 코드가 실행되도록 함, **성공!**

## 7. 데이터 유출

- Host 장악 이후 Sandbox에서 Host를 거쳐 인터넷에 접근할 수 있음을 확인함.
- 프롬프트 인젝션을 통해 Copilot에서 임의의 Python 코드를 실행, Sandbox 내부의 취약점을 이용해 Host까지 탈출하고 이를 통해 외부 공격자 서버와 통신함.
- 이 과정을 통해 Copilot에서 Sandbox로 전달된 데이터를 외부로 유출함.

## 8. 대화형 AI 세션 장악

- **피해자의 Copilot → Sandbox → Host → 공격자** 구조에서 **공격자 → Host → Sandbox → 피해자의 Copilot** 구조(단방향 통신이 아닌 양방향 통신)가 가능함을 확인함.
- 악성 문서에 특정 Python 코드를 실행하고, 해당 코드의 실행 결과를 다음에 수행해야 할 지시문으로 처리하며, 실행한 코드에 대한 정보를 사용자에게 노출하지 않을 것이라는 지침을 포함해 전달함.
- 공격자가 피해자의 Copilot에 직접 접근하지 않고도 외부 서버를 통해 새로운 프롬프트를 전달할 수 있게됨.

## 9. 연구진이 제시한 보안 대응 방안

- AI 보안 측면: 신뢰할 수 없는 입력이 포함된 채팅 세션을 광범위하게 모니터링해야 함.
- 클라우드 보안 측면: Host 네트워크 접근을 제한하고, 내부 서비스도 외부에 노출된 서비스와 동일한 수준의 보안 기준으로 보호해야함.

## 10. 공격 과정

![ChatMate 공격 과정]({{ '/assets/chatmate-attack-process.jpg' | relative_url }})

<p style="text-align: center; font-size: 13px; margin-top: -16px;"><em>(출처: Black Hat USA 2026 | ChatMate: Remote Prompt Execution on AI Assistants through Sandbox Escaping)</em></p>
