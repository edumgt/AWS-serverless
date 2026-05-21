# MD 요약 정리 (이미지 캡처 매칭)

이 문서는 기존 `Readme*.md` 파일의 핵심 흐름을 **캡처 이미지와 1:1로 맞춰** 빠르게 찾아볼 수 있도록 정리한 요약본입니다.

> **주의:** 계정 ID/ARN/키 등 민감정보는 본문에서 모두 마스킹 처리했습니다.

---

## Readme.md (IAM 오류 → Lambda/S3 역할 구성 → CLI 설정)

### 1) IAM 사용자 조회 오류 및 권한 보완
- `aws iam list-users` 실행 시 AccessDenied 오류 확인
- 권한 수 초과로 그룹 지정 후 재실행 결과 확인
- 콘솔에서 사용자 액세스 로그 확인

캡처:
- 권한 수 초과 → 그룹 지정: `image-29.png`, `image-30.png`
- 사용자 액세스 로그: `image-31.png`

### 2) Lambda + S3 연동을 위한 IAM 역할 생성
- IAM 역할 생성 → Lambda 선택 → S3 읽기 권한 부여
- 신뢰 관계(AssumeRole) 구조 확인
- 역할 생성 완료 확인

캡처:
- 신뢰 엔터티/사용 사례: `image.png`, `image-1.png`
- 권한 연결: `image-2.png`
- 역할 세부 입력: `image-3.png`
- 생성 완료: `image-33.png`, `image-34.png`
- 역할 목록 확인: `image-4.png`

### 3) IAM User 권한 강화
- Lambda Full Access 부여 및 현재 권한 확인
- `lambda:CreateFunction` 누락 시 사용자 정의 정책 생성

캡처:
- 권한 부여: `image-6.png`, `image-7.png`
- 현재 권한: `image-8.png`
- 사용자 정의 정책: `image-35.png`, `image-36.png`, `image-37.png`, `image-38.png`, `image-39.png`

### 4) AWS CLI 인증 설정
- `aws configure` 입력 및 `aws sts get-caller-identity` 확인
- 인증 문제 원인 점검

캡처:
- 인증 문제 점검: `image-5.png`
- 로컬 자격 증명 경로: `image-32.png`

---

## Readme2.md (AWS CLI 설치 → Lambda 생성 → S3 이벤트 등록)

### 1) AWS CLI 설치 및 SDK v2 경고
- CLI 설치, 버전 확인, v3 마이그레이션 권장

### 2) Lambda 함수 생성
- ZIP 생성 → `aws lambda create-function` 실행
- 동일 이름 존재 시 ResourceConflictException 안내

캡처:
- 역할 부여 이미지: `image-40.png`, `image-41.png`
- Lambda 콘솔 확인: `image-9.png`, `image-10.png`

### 3) S3 이벤트 알림 등록
- S3 이벤트 알림 생성 → Lambda 선택 → 콘솔 확인

캡처:
- 이벤트 알림 단계: `image-11.png`, `image-12.png`, `image-13.png`, `image-14.png`
- Lambda 선택: `image-15.png`, `image-16.png`, `image-17.png`
- Lambda 콘솔 확인: `image-18.png`

---

## Readme3.md (S3 업로드 트리거 → Lambda → CloudWatch 로그)

### 1) S3 버킷 생성
- 버킷 생성 결과 확인 및 권한 오류 예시

캡처:
- 오류 예시: `image-42.png`
- 생성 확인: `image-43.png`

### 2) IAM 역할 및 정책 구성
- LambdaS3CloudWatchRole 생성, 신뢰 관계 및 정책 확인
- 권한 부족 시 콘솔에서 Inline 정책 추가

캡처:
- 역할 생성/권한: `image-45.png`, `image-46.png`, `image-47.png`, `image-48.png`, `image-49.png`, `image-50.png`, `image-51.png`
- Inline 정책 생성/추가: `image-52.png`, `image-53.png`, `image-54.png`, `image-55.png`, `image-56.png`, `image-57.png`, `image-58.png`, `image-59.png`, `image-60.png`, `image-61.png`

### 3) Lambda 등록 및 S3 알림 연결
- Lambda 생성 후 콘솔 확인
- S3 알림 구성 오류 시 add-permission으로 해결

캡처:
- Lambda 등록 확인: `image-62.png`
- 알림 구성 확인: `image-63.png`

### 4) 업로드 및 로그 확인
- S3 업로드 후 Lambda 자동 실행 로그 확인

캡처:
- 업로드 결과: `image-64.png`
- CloudWatch 로그: `image-65.png`, `image-66.png`

### 5) CloudWatch 로그 권한 보완
- 로그 기록을 위한 권한/정책 추가 안내

캡처:
- 추가 권한 흐름: `image-21.png`, `image-22.png`, `image-23.png`, `image-24.png`, `image-19.png`, `image-25.png`, `image-26.png`, `image-27.png`, `image-28.png`

---

## Readme4.md (To-Do 및 AWS CLI 프로파일)

### 1) To-Do 항목
- 클라우드 네이티브 설계/배포, 마이크로서비스, CI/CD, 보안/모니터링 범주로 구성

### 2) AWS CLI 프로파일 사용법
- `aws configure --profile` 사용
- 설정 파일 저장 위치와 사용 방법(명령/환경 변수)
