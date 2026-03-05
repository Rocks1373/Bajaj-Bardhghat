import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
        }

        // Using Rachel (cheapest English female voice available in the default list)
        // Check https://api.elevenlabs.io/v1/voices for others
        const voiceId = '21m00Tcm4TlvDq8ikWAM';

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
                'accept': 'audio/mpeg',
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_turbo_v2_5', // Quickest and cheapest model
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                }
            }),
        });

        if (!response.ok) {
            console.error('ElevenLabs API error response:', await response.text());
            return NextResponse.json({ error: 'Failed to generate speech' }, { status: response.status });
        }

        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength.toString(),
            }
        });

    } catch (error: any) {
        console.error('TTS API error:', error);
        return NextResponse.json(
            { error: 'Failed to process TTS request', details: error.message },
            { status: 500 }
        );
    }
}
