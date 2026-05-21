# To-Do List 및 AWS CLI 프로파일 정리

> **주의:** 액세스 키 등 민감정보는 마스킹 처리했습니다.

---

## 1) To-Do List
1. **AWS 기반 클라우드 네이티브 애플리케이션 설계 및 배포**
   - AWS 계정 및 IAM 설정
   - EC2 인스턴스 생성 및 관리
   - S3 버킷 생성 및 데이터 업로드
   - VPC, Subnet, Route Table 구성
2. **Microservices Architecture 기반 애플리케이션 개발**
   - 컨테이너 기반 서비스 개발 (Docker)
   - API Gateway 활용 RESTful API 설계
   - Microservices Architecture 설계 및 구현
3. **DevOps 기반 CI/CD 파이프라인 구성 및 배포 자동화**
   - AWS CodePipeline을 활용한 배포 자동화
   - Elastic Load Balancer(ELB) 및 Auto Scaling 설정
   - CloudFormation을 이용한 인프라 자동화
4. **클라우드 네이티브 환경의 보안 및 모니터링 구현**
   - CloudWatch를 이용한 모니터링 및 경고 설정
   - AWS KMS를 활용한 데이터 암호화
   - WAF(Web Application Firewall)를 통한 애플리케이션 보안 강화

---

## 2) AWS CLI 프로파일 사용법

### 기본 명령어
```bash
aws configure --profile <PROFILE_NAME>
# 예: aws configure --profile dev-account
```

### 입력 정보 (예시)
```text
AWS Access Key ID [None]: <REDACTED_ACCESS_KEY>
AWS Secret Access Key [None]: <REDACTED_SECRET_KEY>
Default region name [None]: ap-northeast-2
Default output format [None]: json
```

### 설정 파일 위치
```text
~/.aws/credentials
~/.aws/config
```

#### ~/.aws/credentials 예시
```ini
[default]
aws_access_key_id = <REDACTED_ACCESS_KEY>
aws_secret_access_key = <REDACTED_SECRET_KEY>

[dev-account]
aws_access_key_id = <REDACTED_ACCESS_KEY>
aws_secret_access_key = <REDACTED_SECRET_KEY>
```

#### ~/.aws/config 예시
```ini
[default]
region = ap-northeast-2
output = json

[profile dev-account]
region = us-west-2
output = json
```

---

## 3) 프로파일 사용하는 방법

### CLI 명령에서 사용
```bash
aws s3 ls --profile dev-account
```

### 환경 변수로 사용
```bash
export AWS_PROFILE=dev-account
aws s3 ls
```
