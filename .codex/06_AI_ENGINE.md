# AI ENGINE SPECIFICATION
Version 1.0

========================================
PURPOSE
========================================

This document defines every AI provider used by the application.

Do not replace providers without approval.

Always use Provider Pattern so providers can be swapped later.

========================================
GENERAL RULE
========================================

Every AI service must be isolated.

Each provider lives in its own module.

Never couple UI directly to AI APIs.

========================================
AUTO REMIX
========================================

Main LLM

Gemini 2.5 Flash

Responsibilities

Video Analysis

Rewrite

Scene Planning

Prompt Generation

Metadata

CTA

Thumbnail Prompt

Quality Check

========================================
AUTO TRANSLATE
========================================

LLM

Gemini 2.5 Flash

Speech Recognition

Deepgram Nova

Subtitle

Deepgram

Voice

ElevenLabs

Supported Languages

English

Chinese

Vietnamese

========================================
AUTO MAGIC
========================================

LLM

Gemini 2.5 Flash

Scene Planning

Character Rewrite

Background Rewrite

Prompt Generation

Video Generation

Google Veo

Fallback

Kling

Runway

========================================
IMAGE GENERATION
========================================

Primary

FLUX Kontext

Fallback

GPT Image

========================================
VIDEO GENERATION
========================================

Priority

1

Google Veo

Priority

2

Kling

Priority

3

Runway

========================================
OCR
========================================

PaddleOCR

========================================
SCENE DETECTION
========================================

PySceneDetect

========================================
OBJECT DETECTION
========================================

YOLO11

========================================
FACE ANALYSIS
========================================

InsightFace

========================================
VIDEO PROCESSING
========================================

FFmpeg

OpenCV

========================================
AUDIO
========================================

FFmpeg

Deepgram

ElevenLabs

========================================
PIPELINE
========================================

Video

↓

Analysis

↓

Speech

↓

OCR

↓

Rewrite

↓

Scene Planning

↓

Prompt Generation

↓

Video Generation

↓

Subtitle

↓

Voice

↓

Music

↓

Quality Check

↓

Export

========================================
PROVIDER PATTERN
========================================

Every AI provider must implement a common interface.

Never call APIs directly from UI.

Use dependency injection.

========================================
FUTURE PROVIDERS
========================================

The architecture must support adding:

OpenAI

Anthropic

MiniMax

PixVerse

Luma

Fal.ai

Replicate

without changing the application architecture.

========================================
STRICT RULES
========================================

Never hardcode providers.

Never hardcode API Keys.

Never mix provider logic.

Always isolate every provider.

Always keep providers replaceable.