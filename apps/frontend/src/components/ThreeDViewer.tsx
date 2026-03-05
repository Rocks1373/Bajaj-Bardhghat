'use client';

import { useEffect, useRef } from 'react';

// Declare the custom element type for TypeScript
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    src?: string;
                    alt?: string;
                    'auto-rotate'?: boolean;
                    'camera-controls'?: boolean;
                    'shadow-intensity'?: string;
                    'environment-image'?: string;
                    'exposure'?: string;
                    'shadow-softness'?: string;
                    'camera-orbit'?: string;
                    'min-camera-orbit'?: string;
                    'max-camera-orbit'?: string;
                    'field-of-view'?: string;
                    'interaction-prompt'?: string;
                    'ar'?: boolean;
                    'ar-modes'?: string;
                    'tone-mapping'?: string;
                    'poster'?: string;
                    'loading'?: string;
                    'reveal'?: string;
                },
                HTMLElement
            >;
        }
    }
}

interface ThreeDViewerProps {
    url: string;
    poster?: string;
}

export default function ThreeDViewer({ url, poster }: ThreeDViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Dynamically load the model-viewer script if not already loaded
        if (!customElements.get('model-viewer')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
            document.head.appendChild(script);
        }
    }, []);

    if (!url) {
        return (
            <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-white/5 rounded-2xl">
                <p className="text-white/40">No 3D model available.</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full min-h-[400px] lg:min-h-[500px] bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl overflow-hidden">
            {/* Instructional overlay */}
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white/70 pointer-events-none flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                Drag to rotate • Scroll to zoom
            </div>

            <model-viewer
                src={url}
                alt="Interactive 3D Motorcycle View"
                auto-rotate
                camera-controls
                shadow-intensity="1"
                shadow-softness="0.8"
                exposure="0.8"
                camera-orbit="45deg 55deg 105%"
                min-camera-orbit="auto auto 50%"
                max-camera-orbit="auto auto 200%"
                field-of-view="30deg"
                interaction-prompt="auto"
                tone-mapping="commerce"
                loading="eager"
                poster={poster}
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '400px',
                    backgroundColor: 'transparent',
                    // Custom CSS variables for model-viewer styling
                    '--poster-color': 'transparent',
                } as React.CSSProperties}
            />
        </div>
    );
}
