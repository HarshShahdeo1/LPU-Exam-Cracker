const OpenAI = require('openai');

async function testNvidia() {
  const client = new OpenAI({
    apiKey: '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',
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });

  try {
    console.log('Fetching models...');
    const completion = await client.chat.completions.create({
      model: 'deepseek-ai/deepseek-v4-pro',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 100,
      extra_body: {
        chat_template_kwargs: { thinking: false }
      }
    });
    console.log('Success!', completion.choices[0].message.content);
  } catch (error) {
    console.log('Error status:', error.status);
    console.log('Error message:', error.message);
  }
}

testNvidia();
