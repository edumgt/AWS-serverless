const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const s3 = new S3Client({ region: 'ap-northeast-2' });

const upload = async () => {
  try {
    const command = new PutObjectCommand({
      Bucket: 'edumgt-java-education',
      Key: 'face1.png',
      Body: fs.readFileSync('face1.png'),
      ContentType: 'image/png'
    });
    const result = await s3.send(command);
    console.log('✅ 업로드 성공:', result);
  } catch (err) {
    console.error('❌ 업로드 실패:', err);
  }
};

upload();
