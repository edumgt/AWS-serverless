const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log("📦 이벤트 수신:", JSON.stringify(event, null, 2));

  const record = event.Records[0];
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  try {
    const data = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    const contentType = data.ContentType;

    console.log(`🖼️ ${key} 파일 타입: ${contentType}`);

    return {
      statusCode: 200,
      body: `파일 ${key} (타입: ${contentType}) 읽기 성공`
    };
  } catch (err) {
    console.error("❌ S3 읽기 실패:", err);
    return {
      statusCode: 500,
      body: "에러 발생"
    };
  }
};

