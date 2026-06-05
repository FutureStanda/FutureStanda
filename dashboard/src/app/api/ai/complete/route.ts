import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { prompt, system, messages, stream: shouldStream } = await req.json()

    const msgs = messages || [{ role: 'user', content: prompt }]
    const systemPrompt = system || 'You are Boost, an AI assistant for BizBoost — an agency management platform. You help with business insights, automation building, objective coaching, and lead research. Be concise, specific, and data-driven. Reference real numbers and client names when you have them.'

    if (shouldStream) {
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const stream = await anthropic.messages.stream({
              model: 'claude-sonnet-4-6',
              max_tokens: 1024,
              system: systemPrompt,
              messages: msgs,
            })
            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (err) {
            controller.error(err)
          }
        },
      })
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: msgs,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ text })
  } catch (error) {
    console.error('AI complete error:', error)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
