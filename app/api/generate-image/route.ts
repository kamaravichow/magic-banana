import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const prompt = formData.get('prompt') as string;
        const imageCount = parseInt(formData.get('imageCount') as string || '0');
        const customApiKey = formData.get('customApiKey') as string | null;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Use custom API key if provided, otherwise fall back to environment variable
        const apiKey = customApiKey && customApiKey.trim()
            ? customApiKey.trim()
            : process.env.GEMINI_API_KEY!;

        if (!apiKey) {
            return NextResponse.json({
                error: 'No API key available. Please set GEMINI_API_KEY or provide a custom key.'
            }, { status: 400 });
        }

        const ai = new GoogleGenAI({
            apiKey: apiKey,
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

        // Add multiple images if provided
        for (let i = 0; i < imageCount; i++) {
            const imageFile = formData.get(`image_${i}`) as File | null;
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
        let usageMetadata: any = null;

        for await (const chunk of response) {
            if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
                continue;
            }

            // Capture usage metadata from the last chunk
            if (chunk.usageMetadata) {
                usageMetadata = chunk.usageMetadata;
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

        // Calculate cost based on token usage
        let cost = null;
        if (usageMetadata) {
            const inputTokens = usageMetadata.promptTokenCount || 0;
            const outputTokens = usageMetadata.candidatesTokenCount || 0;

            // Get input image tokens from modality details (for cost display purposes)
            let inputImageTokens = 0;
            if (usageMetadata.promptTokensDetails) {
                const imageDetail = usageMetadata.promptTokensDetails.find((detail: any) => detail.modality === 'IMAGE');
                if (imageDetail) {
                    inputImageTokens = imageDetail.tokenCount;
                }
            }

            // Pricing: 
            // - Input text tokens: $0.30 per 1M tokens
            // - Output text tokens: $2.50 per 1M tokens  
            // - Generated images: $0.04 per image (flat rate)
            const inputTextTokens = inputTokens - inputImageTokens; // Subtract image tokens from total input
            const inputTextCost = (inputTextTokens / 1000000) * 0.30;
            const outputTextCost = (outputTokens / 1000000) * 2.50;

            // Count generated images
            const generatedImages = imageData ? 1 : 0;
            const imageCost = generatedImages * 0.04;

            const totalCost = inputTextCost + outputTextCost + imageCost;

            cost = {
                inputTokens: inputTextTokens,
                outputTokens,
                inputImageTokens,
                generatedImages,
                totalTokens: usageMetadata.totalTokenCount || (inputTokens + outputTokens),
                inputCost: inputTextCost,
                outputCost: outputTextCost,
                imageCost,
                totalCost,
                formattedCost: `$${totalCost.toFixed(4)}`
            };
        }

        return NextResponse.json({
            text: textResponse,
            image: imageData,
            cost,
        });

    } catch (error) {
        console.error('Error generating image:', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}
