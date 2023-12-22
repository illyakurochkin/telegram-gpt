export const messages = {
  greeting: `
Hi, I am your personal assistant.
To start using me, type enter your OpenAI API token.
You can find it here - https://platform.openai.com/api-keys

<code>/token &lt;your-api-key&gt;</code>
  `,
  tokenAccepted: `Your api token is accepted. Now you can start chatting with me.`,
  tokenRejected: `Your api token is rejected. Please use a valid token.`,
  tokenRequired: `Please provide your api token: <code>/token &lt;your-api-key&gt;</code>`,
  userReset: `Your user data has been reset.`,
  somethingWentWrong: `Something went wrong. Please try again later.`,
  processing: `Processing...`,
};
