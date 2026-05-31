module.exports.hello = async (event) => {
  const name = event.queryStringParameters?.name || "Good Morning";

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Good Morning, ${name}` }),
  };
};
