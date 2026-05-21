# S3 업로드 → Lambda 실행 → CloudWatch 로그 (정리본)

> **주의:** 계정 ID/ARN 등 민감정보는 마스킹 처리했습니다.

---

## 목표
- S3에 파일 업로드 시 → **Lambda 자동 실행**
- Lambda는 업로드된 **S3 객체 정보** 처리
- 처리 결과 및 로그는 **CloudWatch Logs**로 출력

### 구성 개요
| 서비스 | 역할 |
| --- | --- |
| **S3** | 트리거 이벤트 발생 (예: `putObject`) |
| **Lambda** | 업로드된 파일 정보를 처리 |
| **CloudWatch Logs** | Lambda 로그 자동 기록 |

---

## 1) S3 버킷 생성
```bash
aws s3api create-bucket \
  --bucket edumgt-bucket-logs \
  --region ap-northeast-2 \
  --create-bucket-configuration LocationConstraint=ap-northeast-2
```

### 결과 예시
```json
{
  "Location": "http://edumgt-bucket-logs.s3.amazonaws.com/"
}
```

### 권한 오류 발생 시
![alt text](image-42.png)

### 생성 확인
![alt text](image-43.png)

---

## 2) IAM 역할 및 정책 구성
- `trust.json`, `s3log.json` 참고
- `test.py` → `test.zip` 압축

### 역할 생성 흐름
![alt text](image-45.png)
![alt text](image-46.png)
![alt text](image-47.png)

### CloudWatch 이벤트 권한 추가
![alt text](image-48.png)
![alt text](image-49.png)
![alt text](image-50.png)

### 신뢰 관계 확인
![alt text](image-51.png)

---

## 3) Lambda 함수 생성
```bash
aws lambda create-function \
  --function-name s3-event-logger \
  --runtime python3.12 \
  --role arn:aws:iam::<ACCOUNT_ID>:role/LambdaS3CloudWatchRole \
  --handler test.lambda_handler \
  --zip-file fileb://test.zip \
  --region ap-northeast-2
```

### 권한 부족으로 실패하는 경우
```text
An error occurred (AccessDenied) when calling the UpdateAssumeRolePolicy operation: User: arn:aws:iam::<ACCOUNT_ID>:user/<IAM_USER> is not authorized to perform: iam:UpdateAssumeRolePolicy on resource: role LambdaS3CloudWatchRole because no identity-based policy allows the iam:UpdateAssumeRolePolicy action
```

### 콘솔에서 Inline 정책 추가
- `s3log.json`의 내용을 **JSON 편집**으로 붙여넣기
- 정책 이름: `LambdaS3InlinePolicy`

![alt text](image-52.png)
![alt text](image-53.png)
![alt text](image-54.png)
![alt text](image-55.png)
![alt text](image-57.png)
![alt text](image-56.png)
![alt text](image-58.png)
![alt text](image-59.png)
![alt text](image-60.png)
![alt text](image-61.png)

---

## 4) 역할 정책 연결 확인
```bash
aws iam list-attached-role-policies --role-name LambdaS3CloudWatchRole
```

### 결과 예시
```json
{
  "AttachedPolicies": [
    {
      "PolicyName": "CloudWatchEventsFullAccess",
      "PolicyArn": "arn:aws:iam::aws:policy/CloudWatchEventsFullAccess"
    },
    {
      "PolicyName": "LambdaS3InlinePolicy",
      "PolicyArn": "arn:aws:iam::<ACCOUNT_ID>:policy/LambdaS3InlinePolicy"
    }
  ]
}
```

---

## 5) Lambda 등록 재실행
```bash
aws lambda create-function \
  --function-name s3-event-logger \
  --runtime python3.12 \
  --role arn:aws:iam::<ACCOUNT_ID>:role/LambdaS3CloudWatchRole \
  --handler test.lambda_handler \
  --zip-file fileb://test.zip \
  --region ap-northeast-2
```

### 결과 예시 (요약)
```json
{
  "FunctionName": "s3-event-logger",
  "FunctionArn": "arn:aws:lambda:ap-northeast-2:<ACCOUNT_ID>:function:s3-event-logger",
  "Runtime": "python3.12",
  "Role": "arn:aws:iam::<ACCOUNT_ID>:role/LambdaS3CloudWatchRole",
  "Handler": "test.lambda_handler",
  "CodeSize": 514,
  "Timeout": 3,
  "MemorySize": 128,
  "LastModified": "2025-06-23T12:09:42.372+0000",
  "State": "Pending",
  "StateReasonCode": "Creating"
}
```

### 콘솔 확인
![alt text](image-62.png)

---

## 6) S3 → Lambda 이벤트 알림 연결
```bash
aws s3api put-bucket-notification-configuration \
  --bucket edumgt-bucket-logs \
  --notification-configuration file://snsnoti.json
```

### 오류 예시
```text
An error occurred (InvalidArgument) when calling the PutBucketNotificationConfiguration operation: Unable to validate the following destination configurations
```

> **원인:** Lambda에 S3가 호출할 수 있는 권한(`add-permission`)이 없음

### 권한 부여
```bash
aws lambda add-permission \
  --function-name s3-event-logger \
  --principal s3.amazonaws.com \
  --statement-id AllowS3Invoke \
  --action lambda:InvokeFunction \
  --source-arn arn:aws:s3:::edumgt-bucket-logs
```

#### 주의 사항
- `--function-name`은 **Lambda 이름 또는 ARN**
- `--source-arn`은 **S3 버킷 ARN**
- `--statement-id`는 **고유값** 필요

### 결과 예시
```json
{
  "Statement": "{\"Sid\":\"AllowS3Invoke\",\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"s3.amazonaws.com\"},\"Action\":\"lambda:InvokeFunction\",\"Resource\":\"arn:aws:lambda:ap-northeast-2:<ACCOUNT_ID>:function:s3-event-logger\",\"Condition\":{\"ArnLike\":{\"AWS:SourceArn\":\"arn:aws:s3:::edumgt-bucket-logs\"}}}"
}
```

### 재실행
```bash
aws s3api put-bucket-notification-configuration \
  --bucket edumgt-bucket-logs \
  --notification-configuration file://snsnoti.json
```

### 콘솔 확인
![alt text](image-63.png)

---

## 7) 업로드 및 로그 확인
```bash
aws s3 cp face1.png s3://edumgt-bucket-logs/
```

### 업로드 결과
```text
upload: ./face1.png to s3://edumgt-bucket-logs/face1.png
```

### CloudWatch 로그 확인
```bash
aws logs describe-log-groups
```

![alt text](image-64.png)
![alt text](image-65.png)
![alt text](image-66.png)

---

## 8) CloudWatch 로그 권한 보완
![alt text](image-21.png)
![alt text](image-22.png)
![alt text](image-23.png)
![alt text](image-24.png)

### 추가 권한 예시
![alt text](image-19.png)
![alt text](image-25.png)

### CloudWatch 확인
![alt text](image-26.png)
![alt text](image-27.png)
![alt text](image-28.png)

---

> **참고:** 위 내용은 기존 예제를 보완한 정리본입니다.
