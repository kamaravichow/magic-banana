import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File | null;
        const customApiKey = formData.get('customApiKey') as string | null;
        const fidelity = formData.get('fidelity') as string || '0.7';
        const upscale = formData.get('upscale') as string || '2';

        if (!imageFile) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        // Use custom API key if provided, otherwise fall back to environment variable
        const apiKey = customApiKey && customApiKey.trim()
            ? customApiKey.trim()
            : process.env.REPLICATE_API_TOKEN;

        if (!apiKey) {
            return NextResponse.json({
                error: 'No API key available. Please set REPLICATE_API_TOKEN or provide a custom key.'
            }, { status: 400 });
        }

        // Convert image to base64
        const imageBuffer = await imageFile.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageFile.type;
        const dataUri = `data:${mimeType};base64,${imageBase64}`;

        // Prepare the request to Replicate API
        const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: 'cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2',
                input: {
                    image: dataUri,
                    upscale: parseInt(upscale),
                    codeformer_fidelity: parseFloat(fidelity),
                    face_upsample: true,
                    background_enhance: false
                }
            })
        });

        if (!replicateResponse.ok) {
            const errorData = await replicateResponse.json();
            console.error('Replicate API error:', errorData);
            return NextResponse.json({
                error: `Replicate API error: ${errorData.detail || replicateResponse.statusText}`
            }, { status: replicateResponse.status });
        }

        const prediction = await replicateResponse.json();

        // Poll for the result
        let result = prediction;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes with 5-second intervals

        while (result.status === 'starting' || result.status === 'processing') {
            if (attempts >= maxAttempts) {
                return NextResponse.json({
                    error: 'Enhancement timed out. Please try again.'
                }, { status: 408 });
            }

            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            attempts++;

            const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
                headers: {
                    'Authorization': `Token ${apiKey}`,
                },
            });

            if (!pollResponse.ok) {
                return NextResponse.json({
                    error: 'Failed to poll prediction status'
                }, { status: 500 });
            }

            result = await pollResponse.json();
        }

        if (result.status === 'failed') {
            return NextResponse.json({
                error: result.error || 'Enhancement failed'
            }, { status: 500 });
        }

        if (result.status === 'succeeded' && result.output) {
            // The output is typically a URL to the enhanced image
            const enhancedImageUrl = result.output;

            // Fetch the enhanced image and convert to base64
            const imageResponse = await fetch(enhancedImageUrl);
            if (!imageResponse.ok) {
                return NextResponse.json({
                    error: 'Failed to fetch enhanced image'
                }, { status: 500 });
            }

            const enhancedImageBuffer = await imageResponse.arrayBuffer();
            const enhancedImageBase64 = Buffer.from(enhancedImageBuffer).toString('base64');

            return NextResponse.json({
                success: true,
                enhancedImage: {
                    data: enhancedImageBase64,
                    mimeType: 'image/png' // CodeFormer typically outputs PNG
                },
                originalImageUrl: enhancedImageUrl
            });
        }

        return NextResponse.json({
            error: 'Enhancement completed but no output was generated'
        }, { status: 500 });

    } catch (error) {
        console.error('Error enhancing image:', error);
        return NextResponse.json(
            { error: 'Failed to enhance image' },
            { status: 500 }
        );
    }
}
