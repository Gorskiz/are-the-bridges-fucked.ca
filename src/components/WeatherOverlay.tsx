/**
 * Weather Overlay Component
 * Animated weather effects (snow, rain, etc.)
 */

import { useEffect, useRef } from 'react';
import type { WeatherCondition, WeatherSeverity } from '../types/weather';
import './WeatherOverlay.css';

interface WeatherOverlayProps {
    condition: WeatherCondition;
    severity: WeatherSeverity;
    isDay: boolean;
}

export function WeatherOverlay({ condition, severity }: WeatherOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const updateSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        updateSize();
        window.addEventListener('resize', updateSize);

        // Determine particle settings based on condition
        const settings = getParticleSettings(condition, severity);

        // Initialize particles
        particlesRef.current = [];
        for (let i = 0; i < settings.count; i++) {
            particlesRef.current.push(createParticle(canvas.width, canvas.height, settings));
        }

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((particle) => {
                updateParticle(particle, canvas.width, canvas.height, settings);
                drawParticle(ctx, particle, settings);
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        if (settings.count > 0) {
            animate();
        }

        return () => {
            window.removeEventListener('resize', updateSize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [condition, severity]);

    // Don't render overlay for clear/normal conditions
    if (!shouldShowOverlay(condition)) {
        return null;
    }

    return (
        <div className={`weather-overlay weather-overlay--${condition} weather-overlay--${severity}`}>
            <canvas
                ref={canvasRef}
                className="weather-overlay__canvas"
                aria-hidden="true"
            />
            {/* Fog effect */}
            {condition === 'fog' && <div className="weather-overlay__fog" />}

            {/* Blizzard effects - wind streaks and whiteout */}
            {condition === 'blizzard' && (
                <>
                    <div className="weather-overlay__blizzard-wind" />
                    <div className="weather-overlay__blizzard-whiteout" />
                </>
            )}

            {/* Thunderstorm effects - dark atmosphere and lightning */}
            {condition === 'thunderstorm' && (
                <>
                    <div className="weather-overlay__storm-atmosphere" />
                    <div className="weather-overlay__lightning" />
                </>
            )}

            {/* Hurricane effects - swirl and darkness */}
            {condition === 'hurricane' && (
                <>
                    <div className="weather-overlay__hurricane-swirl" />
                    <div className="weather-overlay__hurricane-darkness" />
                </>
            )}

            {/* General dramatic effect for severe weather */}
            {(severity === 'fucked' || severity === 'apocalyptic') && (
                <div className="weather-overlay__dramatic" />
            )}
        </div>
    );
}

// Particle types and helpers
interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    rotation?: number;
    rotationSpeed?: number;
}

interface ParticleSettings {
    count: number;
    type: 'snow' | 'rain' | 'none';
    color: string;
    minSize: number;
    maxSize: number;
    minSpeed: number;
    maxSpeed: number;
    wind: number;
    sway: boolean;
}

function shouldShowOverlay(condition: WeatherCondition): boolean {
    return ['snow', 'heavy_snow', 'blizzard', 'rain', 'heavy_rain', 'drizzle', 'freezing_rain', 'fog', 'thunderstorm', 'hurricane'].includes(condition);
}

function getParticleSettings(condition: WeatherCondition, _severity: WeatherSeverity): ParticleSettings {
    const baseSettings: ParticleSettings = {
        count: 0,
        type: 'none',
        color: 'rgba(255, 255, 255, 0.8)',
        minSize: 2,
        maxSize: 4,
        minSpeed: 1,
        maxSpeed: 3,
        wind: 0,
        sway: false,
    };

    switch (condition) {
        case 'snow':
            return {
                ...baseSettings,
                count: 100,
                type: 'snow',
                minSize: 2,
                maxSize: 5,
                minSpeed: 0.5,
                maxSpeed: 2,
                wind: 0.5,
                sway: true,
            };

        case 'heavy_snow':
            return {
                ...baseSettings,
                count: 200,
                type: 'snow',
                minSize: 2,
                maxSize: 6,
                minSpeed: 1,
                maxSpeed: 3,
                wind: 1,
                sway: true,
            };

        case 'blizzard':
            return {
                ...baseSettings,
                count: 350,
                type: 'snow',
                minSize: 2,
                maxSize: 8,
                minSpeed: 2,
                maxSpeed: 5,
                wind: 3,
                sway: true,
            };

        case 'drizzle':
            return {
                ...baseSettings,
                count: 80,
                type: 'rain',
                color: 'rgba(174, 194, 224, 0.5)',
                minSize: 1,
                maxSize: 2,
                minSpeed: 4,
                maxSpeed: 6,
                wind: 0.2,
                sway: false,
            };

        case 'rain':
            return {
                ...baseSettings,
                count: 150,
                type: 'rain',
                color: 'rgba(174, 194, 224, 0.6)',
                minSize: 1,
                maxSize: 3,
                minSpeed: 8,
                maxSpeed: 12,
                wind: 0.5,
                sway: false,
            };

        case 'heavy_rain':
        case 'freezing_rain':
            return {
                ...baseSettings,
                count: 250,
                type: 'rain',
                color: condition === 'freezing_rain'
                    ? 'rgba(200, 220, 255, 0.7)'
                    : 'rgba(174, 194, 224, 0.7)',
                minSize: 2,
                maxSize: 4,
                minSpeed: 12,
                maxSpeed: 18,
                wind: 1,
                sway: false,
            };

        // Thunderstorm - heavy rain with dramatic atmosphere
        case 'thunderstorm':
            return {
                ...baseSettings,
                count: 300,
                type: 'rain',
                color: 'rgba(150, 170, 200, 0.75)',
                minSize: 2,
                maxSize: 5,
                minSpeed: 15,
                maxSpeed: 22,
                wind: 2,
                sway: false,
            };

        // Hurricane - absolute chaos rain
        case 'hurricane':
            return {
                ...baseSettings,
                count: 400,
                type: 'rain',
                color: 'rgba(140, 160, 190, 0.8)',
                minSize: 2,
                maxSize: 6,
                minSpeed: 18,
                maxSpeed: 28,
                wind: 5,
                sway: false,
            };

        default:
            return baseSettings;
    }
}

function createParticle(width: number, height: number, settings: ParticleSettings): Particle {
    return {
        x: Math.random() * width,
        y: Math.random() * height - height, // Start above viewport
        size: settings.minSize + Math.random() * (settings.maxSize - settings.minSize),
        speedX: settings.wind * (0.5 + Math.random() * 0.5),
        speedY: settings.minSpeed + Math.random() * (settings.maxSpeed - settings.minSpeed),
        opacity: 0.3 + Math.random() * 0.7,
        rotation: settings.sway ? Math.random() * Math.PI * 2 : 0,
        rotationSpeed: settings.sway ? (Math.random() - 0.5) * 0.02 : 0,
    };
}

function updateParticle(particle: Particle, width: number, height: number, settings: ParticleSettings): void {
    particle.y += particle.speedY;
    particle.x += particle.speedX;

    // Add sway for snow
    if (settings.sway) {
        particle.x += Math.sin(particle.y * 0.01) * 0.5;
        particle.rotation! += particle.rotationSpeed!;
    }

    // Reset when off screen
    if (particle.y > height) {
        particle.y = -particle.size;
        particle.x = Math.random() * width;
    }
    if (particle.x > width) {
        particle.x = 0;
    }
    if (particle.x < 0) {
        particle.x = width;
    }
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle, settings: ParticleSettings): void {
    ctx.save();
    ctx.globalAlpha = particle.opacity;

    if (settings.type === 'snow') {
        // Draw snowflake
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation || 0);
        ctx.fillStyle = settings.color;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Add subtle glow for larger flakes
        if (particle.size > 4) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }
    } else if (settings.type === 'rain') {
        // Draw rain drop (elongated)
        ctx.strokeStyle = settings.color;
        ctx.lineWidth = particle.size * 0.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.speedX * 2, particle.y - particle.speedY * 2);
        ctx.stroke();
    }

    ctx.restore();
}

export default WeatherOverlay;
