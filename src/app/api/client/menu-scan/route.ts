import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getCurrentUser } from '@/lib/auth'

interface ExtractedItem {
  name: string
  price: number
  description: string
  category: string
}

const EXTRACTION_PROMPT = `Extract all menu items from this menu image. Return ONLY a valid JSON array with no additional text.

Each item should have:
- "name": Item name (string)
- "price": Price as a number (e.g., 12.50 or 10)
- "description": Brief description if visible, otherwise empty string
- "category": Category name (e.g., "Breakfast", "Drinks", "Extras")

Rules:
- Include ALL items with prices
- Infer categories from section headers or group similar items
- Use "Uncategorized" only if no category is determinable
- Prices should be numbers, not strings
- Do not include items without prices

Example output:
[
  {"name": "Eggs Benedict", "price": 24, "description": "poached eggs, hollandaise", "category": "Breakfast"},
  {"name": "Coffee", "price": 5, "description": "", "category": "Drinks"}
]`

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image type. Please upload PNG, JPG, WEBP, or GIF.' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    // Call Claude API with vision
    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    })

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { success: false, error: 'Failed to extract menu items' },
        { status: 500 }
      )
    }

    // Parse JSON from response
    let items: ExtractedItem[]
    try {
      // Try to extract JSON from the response (Claude might include markdown code blocks)
      let jsonText = textContent.text.trim()

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7)
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3)
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3)
      }
      jsonText = jsonText.trim()

      items = JSON.parse(jsonText)

      // Validate the structure
      if (!Array.isArray(items)) {
        throw new Error('Response is not an array')
      }

      // Ensure each item has required fields
      items = items.map((item) => ({
        name: String(item.name || ''),
        price: Number(item.price) || 0,
        description: String(item.description || ''),
        category: String(item.category || 'Uncategorized'),
      })).filter((item) => item.name && item.price > 0)

    } catch (parseError) {
      console.error('Failed to parse Claude response:', textContent.text)
      return NextResponse.json(
        { success: false, error: 'Failed to parse extracted menu items' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: items,
    })

  } catch (error) {
    console.error('Menu scan error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process menu image' },
      { status: 500 }
    )
  }
}
