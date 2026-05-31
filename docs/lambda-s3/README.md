# AWS Lambda + S3 실습 가이드

> **주의:** 계정 ID, 사용자명, 액세스 키 등 민감정보는 모두 **마스킹** 처리했습니다.

S3 버킷에 파일을 업로드하면 Lambda가 자동 실행되고, 처리 결과를 CloudWatch Logs에 기록하는 전체 흐름을 다룹니다.

## 구성 개요

| 서비스 | 역할 |
| --- | --- |
| **S3** | 파일 업로드 시 트리거 이벤트 발생 (`putObject`) |
| **Lambda** | 업로드된 파일 정보를 처리 (Node.js / Python) |
| **CloudWatch Logs** | Lambda 실행 로그 자동 기록 |
| **IAM** | Lambda ↔ S3 / CloudWatch 권한 관리 |

### 전체 흐름
1. S3 버킷 생성 (또는 기존 버킷 사용)
2. Lambda용 IAM 역할 생성 (S3 접근 + CloudWatch 로그 권한)
3. Lambda 함수 생성 (Node.js 또는 Python 코드)
4. S3 이벤트 트리거로 Lambda 연결
5. 파일 업로드 → Lambda 자동 실행 → 로그 확인

---

## 1. IAM 역할 생성

### 1-1. Lambda용 IAM 역할 생성

AWS 콘솔 → IAM → 역할 → 역할 생성

- **신뢰할 수 있는 엔터티 유형:** AWS 서비스
- **사용 사례:** Lambda

![신뢰 엔터티 선택](image.png)
![Lambda 사용 사례 선택](image-1.png)

### 1-2. 권한 정책 연결

- 기본 정책: `AmazonS3ReadOnlyAccess`

![S3 권한 연결](image-2.png)

### 1-3. 역할 세부 정보 입력

- 역할 이름 예: `Lamda_S3_Test`

![역할 세부 입력](image-3.png)
![역할 생성 완료](image-33.png)
![역할 생성 완료 확인](image-34.png)
![역할 목록 확인](image-4.png)

### 신뢰 정책 핵심 부분 (`trust.json`)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

> `sts:AssumeRole`은 Lambda 서비스가 이 역할을 임시로 위임받아 사용함을 의미합니다.

---

## 2. IAM 사용자 권한 설정

### Lambda Full Access 부여

IAM → 사용자 → 권한 추가 → `AWSLambdaFullAccess` 연결

![권한 부여](image-6.png)
![권한 부여 확인](image-7.png)
![현재 권한 목록](image-8.png)

### `lambda:CreateFunction` 누락 시 사용자 정의 정책 생성

![사용자 정의 정책 1](image-35.png)
![사용자 정의 정책 2](image-36.png)
![사용자 정의 정책 3](image-37.png)
![사용자 정의 정책 4](image-38.png)
![정책 JSON 입력](image-39.png)

---

## 3. AWS CLI 설치 및 인증 설정

### AWS CLI 설치 (Linux / Codespace)

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
# 예: aws-cli/2.27.40 Python/3.13.4 Linux/6.8.0 exe/x86_64
```

### 인증 설정

```bash
aws configure
# AWS Access Key ID     [None]: <YOUR_ACCESS_KEY>
# AWS Secret Access Key [None]: <YOUR_SECRET_KEY>
# Default region name   [None]: ap-northeast-2
# Default output format [None]: json
```

### 인증 확인

```bash
aws sts get-caller-identity
```

```json
{
  "UserId": "<IAM_USER_ID>",
  "Account": "<ACCOUNT_ID>",
  "Arn": "arn:aws:iam::<ACCOUNT_ID>:user/<IAM_USER>"
}
```

![인증 문제 점검](image-5.png)
![로컬 자격 증명 경로](image-32.png)

### IAM 사용자 목록 조회 오류 시

```text
AccessDenied: iam:ListUsers is not authorized
```

그룹에 권한 추가 후 재실행:

![그룹 권한 추가](image-29.png)
![권한 추가 확인](image-30.png)
![사용자 액세스 로그](image-31.png)

---

## 4. AWS SDK v2 → v3 마이그레이션 안내

```text
NOTE: The AWS SDK for JavaScript (v2) is in maintenance mode.
```

AWS SDK v2는 보안 패치 위주의 유지보수 모드입니다. v3로 마이그레이션을 권장합니다.

```bash
npm install @aws-sdk/client-s3
```

---

## 5. Lambda 함수 생성

### Node.js Lambda (S3 이벤트 처리)

[`nodejs/lambda-s3/index.js`](../../nodejs/lambda-s3/index.js) 참고

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const record = event.Records[0];
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  const data = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  console.log(`파일 타입: ${data.ContentType}`);

  return { statusCode: 200, body: `${key} 읽기 성공` };
};
```

### Python Lambda (S3 이벤트 처리)

[`nodejs/lambda-s3/test.py`](../../nodejs/lambda-s3/test.py) 참고

```python
import json, boto3

def lambda_handler(event, context):
    s3_event = event['Records'][0]['s3']
    bucket = s3_event['bucket']['name']
    key = s3_event['object']['key']
    print(f"[업로드 감지] Bucket: {bucket}, Key: {key}")
    s3 = boto3.client('s3')
    obj = s3.get_object(Bucket=bucket, Key=key)
    content = obj['Body'].read().decode('utf-8')
    print(f"[파일 내용] {content}")
    return {'statusCode': 200, 'body': json.dumps(f"{key} 처리 완료")}
```

### Windows PowerShell에서 ZIP 생성

```powershell
Compress-Archive -Path index.js -DestinationPath function.zip
```

### Lambda 함수 등록 (AWS CLI)

```bash
aws lambda create-function \
  --function-name edumgt-lambda-function \
  --runtime nodejs20.x \
  --role arn:aws:iam::<ACCOUNT_ID>:role/Lamda_S3_Test \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --region ap-northeast-2
```

| 옵션 | 설명 |
| --- | --- |
| `--function-name` | 생성할 Lambda 함수 이름 |
| `--runtime` | 런타임 버전 (`nodejs20.x`, `python3.12` 등) |
| `--role` | 실행 역할 ARN (필수 권한 포함) |
| `--handler` | Lambda 진입점 (`파일명.함수명`) |
| `--zip-file` | 배포 ZIP 경로 |
| `--region` | 리전 (서울: `ap-northeast-2`) |

![역할 부여 확인](image-40.png)
![Lambda 생성 확인](image-41.png)

### 생성 결과 예시

```json
{
  "FunctionName": "edumgt-lambda-function",
  "FunctionArn": "arn:aws:lambda:ap-northeast-2:<ACCOUNT_ID>:function:edumgt-lambda-function",
  "Runtime": "nodejs20.x",
  "Handler": "index.handler",
  "State": "Active"
}
```

### 동일 이름 함수 존재 시

```text
ResourceConflictException: Function already exist: edumgt-lambda-function
```

콘솔 확인:

![Lambda 콘솔 확인](image-9.png)
![Lambda 코드 확인](image-10.png)

---

## 6. S3 이벤트 알림 등록

S3 → 버킷 → 속성 → 이벤트 알림 → 알림 생성

![이벤트 알림 1](image-11.png)
![이벤트 알림 2](image-12.png)
![이벤트 알림 3](image-13.png)
![이벤트 알림 4](image-14.png)
![Lambda 선택](image-15.png)
![Lambda 선택 확인](image-16.png)
![알림 저장](image-17.png)
![Lambda 콘솔에서 트리거 확인](image-18.png)

---

## 7. S3 버킷 생성 및 Lambda 연동 (CLI)

### S3 버킷 생성

```bash
aws s3api create-bucket \
  --bucket edumgt-bucket-logs \
  --region ap-northeast-2 \
  --create-bucket-configuration LocationConstraint=ap-northeast-2
```

결과:

```json
{ "Location": "http://edumgt-bucket-logs.s3.amazonaws.com/" }
```

![권한 오류 예시](image-42.png)
![버킷 생성 확인](image-43.png)

### IAM 역할 및 정책 구성 (LambdaS3CloudWatchRole)

`s3log.json` 정책 내용:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
    "Resource": "*"
  }]
}
```

![역할 생성](image-45.png)
![역할 설정](image-46.png)
![역할 완료](image-47.png)
![CloudWatch 권한 추가](image-48.png)
![권한 추가 2](image-49.png)
![권한 추가 3](image-50.png)
![신뢰 관계 확인](image-51.png)

### 권한 부족 시 콘솔에서 Inline 정책 추가

![Inline 정책 1](image-52.png)
![Inline 정책 2](image-53.png)
![Inline 정책 3](image-54.png)
![Inline 정책 4](image-55.png)
![Inline 정책 5](image-57.png)
![Inline 정책 6](image-56.png)
![Inline 정책 7](image-58.png)
![Inline 정책 8](image-59.png)
![Inline 정책 9](image-60.png)
![Inline 정책 10](image-61.png)

### Python Lambda 등록

```bash
# ZIP 생성
zip test.zip test.py

# Lambda 생성
aws lambda create-function \
  --function-name s3-event-logger \
  --runtime python3.12 \
  --role arn:aws:iam::<ACCOUNT_ID>:role/LambdaS3CloudWatchRole \
  --handler test.lambda_handler \
  --zip-file fileb://test.zip \
  --region ap-northeast-2
```

### 역할 정책 확인

```bash
aws iam list-attached-role-policies --role-name LambdaS3CloudWatchRole
```

```json
{
  "AttachedPolicies": [
    { "PolicyName": "CloudWatchEventsFullAccess" },
    { "PolicyName": "LambdaS3InlinePolicy" }
  ]
}
```

![Lambda 등록 완료](image-62.png)

---

## 8. S3 → Lambda 이벤트 알림 연결 (CLI)

### Lambda에 S3 호출 권한 부여

```bash
aws lambda add-permission \
  --function-name s3-event-logger \
  --principal s3.amazonaws.com \
  --statement-id AllowS3Invoke \
  --action lambda:InvokeFunction \
  --source-arn arn:aws:s3:::edumgt-bucket-logs
```

> `--statement-id`는 고유값이어야 합니다.

### S3 이벤트 알림 구성 (`snsnoti.json`)

```json
{
  "LambdaFunctionConfigurations": [{
    "LambdaFunctionArn": "arn:aws:lambda:ap-northeast-2:<ACCOUNT_ID>:function:s3-event-logger",
    "Events": ["s3:ObjectCreated:*"]
  }]
}
```

```bash
aws s3api put-bucket-notification-configuration \
  --bucket edumgt-bucket-logs \
  --notification-configuration file://snsnoti.json
```

> **오류:** `Unable to validate the following destination configurations`  
> **원인:** Lambda에 S3 호출 권한이 없음 → 위 `add-permission` 명령으로 해결

![알림 구성 확인](image-63.png)

---

## 9. 파일 업로드 및 CloudWatch 로그 확인

### S3 파일 업로드

```bash
aws s3 cp face1.png s3://edumgt-bucket-logs/
# upload: ./face1.png to s3://edumgt-bucket-logs/face1.png
```

### Node.js 업로드 스크립트 실행 (SDK v2)

```bash
cd nodejs/lambda-s3
npm install
node upload.js      # AWS SDK v2 (dotenv 환경변수 사용)
node upload3.js     # AWS SDK v3
```

### CloudWatch 로그 확인

```bash
aws logs describe-log-groups
aws logs describe-log-streams --log-group-name /aws/lambda/s3-event-logger
aws logs get-log-events \
  --log-group-name /aws/lambda/s3-event-logger \
  --log-stream-name <LOG_STREAM_NAME>
```

![업로드 결과](image-64.png)
![CloudWatch 로그 1](image-65.png)
![CloudWatch 로그 2](image-66.png)

### CloudWatch 로그 권한 보완

![권한 보완 1](image-21.png)
![권한 보완 2](image-22.png)
![권한 보완 3](image-23.png)
![권한 보완 4](image-24.png)
![추가 권한](image-19.png)
![추가 권한 2](image-25.png)
![CloudWatch 확인 1](image-26.png)
![CloudWatch 확인 2](image-27.png)
![CloudWatch 확인 3](image-28.png)

---

## 10. AWS CLI 프로파일 사용법

### 프로파일 등록

```bash
aws configure --profile dev-account
# AWS Access Key ID     [None]: <REDACTED>
# AWS Secret Access Key [None]: <REDACTED>
# Default region name   [None]: ap-northeast-2
# Default output format [None]: json
```

### 설정 파일 위치

```
~/.aws/credentials
~/.aws/config
```

`~/.aws/credentials` 예시:

```ini
[default]
aws_access_key_id = <REDACTED>
aws_secret_access_key = <REDACTED>

[dev-account]
aws_access_key_id = <REDACTED>
aws_secret_access_key = <REDACTED>
```

`~/.aws/config` 예시:

```ini
[default]
region = ap-northeast-2
output = json

[profile dev-account]
region = us-west-2
output = json
```

### 프로파일 사용

```bash
# CLI 명령에서 직접 지정
aws s3 ls --profile dev-account

# 환경 변수로 설정
export AWS_PROFILE=dev-account
aws s3 ls
```

---

## 참고 링크

- [nodejs/lambda-s3/](../../nodejs/lambda-s3/) — Node.js Lambda + S3 소스 코드
- [nodejs/lambda-s3/trust.json](../../nodejs/lambda-s3/trust.json) — IAM 신뢰 정책
- [nodejs/lambda-s3/s3log.json](../../nodejs/lambda-s3/s3log.json) — S3/CloudWatch 권한 정책
- [nodejs/lambda-s3/snsnoti.json](../../nodejs/lambda-s3/snsnoti.json) — S3 이벤트 알림 구성
