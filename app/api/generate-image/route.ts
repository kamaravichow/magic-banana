import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const prompt = formData.get('prompt') as string;
        const imageFile = formData.get('image') as File | null;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY!,
        });

        const config = {
            responseModalities: ['IMAGE', 'TEXT'],
        };

        const model = 'gemini-2.5-flash-image-preview';

        // Build the content parts
        const parts: any[] = [
            {
                text: prompt,
            },
        ];

        // Add image if provided
        if (imageFile) {
            const imageBuffer = await imageFile.arrayBuffer();
            const imageBase64 = Buffer.from(imageBuffer).toString('base64');
            const mimeType = imageFile.type;

            parts.push({
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType,
                },
            });
        }

        const contents = [
            {
                role: 'user' as const,
                parts,
            },
        ];

        const response = await ai.models.generateContentStream({
            model,
            config,
            contents,
        });

        let textResponse = '';
        let imageData: { data: string; mimeType: string } | null = null;

        for await (const chunk of response) {
            if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
                continue;
            }

            // Check for inline image data
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                const inlineData = chunk.candidates[0].content.parts[0].inlineData;
                imageData = {
                    data: inlineData.data || '',
                    mimeType: inlineData.mimeType || 'image/png',
                };
            } else if (chunk.text) {
                textResponse += chunk.text;
            }
        }

        return NextResponse.json({
            text: textResponse,
            image: imageData,
        });

    } catch (error) {
        console.error('Error generating image:', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}
