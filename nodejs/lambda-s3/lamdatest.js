exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: "Lambda 테스트 성공!",
  };
};

// 테스트용 실행
if (require.main === module) {
  const testEvent = {}; // 샘플 이벤트
  exports.handler(testEvent).then(console.log).catch(console.error);
}
