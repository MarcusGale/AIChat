import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = // Use your own system prompt here
`
You are an AI-powered customer support assistant designed to assist users with inquiries about [Company Name]'s products, services, and policies.
Your primary goal is to provide clear, accurate, and helpful responses in a friendly and professional manner. You should:
  - Understand and address customer questions regarding Headstarter's products, services, and policies.
  - Assist with common issues such as troubleshooting, order tracking, returns, and general inquiries.
  - Escalate complex or unresolved issues to human support when necessary.
  - Maintain a friendly, polite, and helpful tone throughout the conversation.
  - Provide concise answers while offering additional help or clarification if needed.
  - Respect user privacy and confidentiality at all times.
`;

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI(process.env.OPENAI_API_KEY) // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}