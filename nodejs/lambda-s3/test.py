import json
import boto3

def lambda_handler(event, context):
    # S3에서 업로드된 객체 정보 추출
    s3_event = event['Records'][0]['s3']
    bucket = s3_event['bucket']['name']
    key = s3_event['object']['key']

    print(f"[✅ 업로드 감지] Bucket: {bucket}, Key: {key}")

    # S3에서 파일 내용을 읽음
    s3 = boto3.client('s3')
    obj = s3.get_object(Bucket=bucket, Key=key)
    content = obj['Body'].read().decode('utf-8')
    
    print(f"[📄 파일 내용] {content}")

    return {
        'statusCode': 200,
        'body': json.dumps(f"{key} 파일 처리 완료")
    }
