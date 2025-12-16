#!/usr/bin/env python3
"""
Test script to evaluate Groq Llama 4 Scout vision capabilities.

This tests:
1. Basic image understanding
2. Document/receipt OCR accuracy
3. Latency comparison
4. Token usage

Usage:
    python test_llama4_vision.py [--image PATH_TO_IMAGE]
"""

import os
import sys
import time
import base64
import json
from pathlib import Path
from groq import Groq

# Groq API key from environment
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("Error: GROQ_API_KEY environment variable not set")
    print("Please set it in your .env file or export it:")
    print("  export GROQ_API_KEY=your-key-here")
    sys.exit(1)

# Models to test
MODELS = {
    "llama4_scout": "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama4_maverick": "meta-llama/llama-4-maverick-17b-128e-instruct",
    "llama33_70b": "llama-3.3-70b-versatile",  # Current model (text-only)
}

# Test prompts for different scenarios
TEST_PROMPTS = {
    "document_ocr": "Extract all text from this document image. Include any numbers, dates, and names you see.",
    "receipt_data": "This is a receipt or invoice. Extract: vendor name, date, total amount, and line items if visible.",
    "general_describe": "Describe what you see in this image in detail.",
    "table_extraction": "If there's a table in this image, extract its contents as structured data.",
}


def encode_image_to_base64(image_path: str) -> str:
    """Read an image file and encode it to base64."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def get_image_mime_type(image_path: str) -> str:
    """Determine MIME type from file extension."""
    ext = Path(image_path).suffix.lower()
    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    return mime_types.get(ext, "image/jpeg")


def test_vision_model(
    client: Groq,
    model_id: str,
    image_path: str,
    prompt: str,
    prompt_type: str = "general"
) -> dict:
    """
    Test a vision-capable model with an image.

    Returns dict with: response, latency_ms, input_tokens, output_tokens, success, error
    """
    result = {
        "model": model_id,
        "prompt_type": prompt_type,
        "success": False,
        "response": None,
        "latency_ms": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "error": None,
    }

    # Encode image
    try:
        image_base64 = encode_image_to_base64(image_path)
        mime_type = get_image_mime_type(image_path)
        image_data_uri = f"data:{mime_type};base64,{image_base64}"
    except Exception as e:
        result["error"] = f"Failed to encode image: {e}"
        return result

    # Build message with image
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": image_data_uri
                    }
                },
                {
                    "type": "text",
                    "text": prompt
                }
            ]
        }
    ]

    # Call API with timing
    start_time = time.time()
    try:
        response = client.chat.completions.create(
            model=model_id,
            messages=messages,
            max_tokens=2000,
            temperature=0.1,  # Low temp for accuracy
        )

        latency_ms = int((time.time() - start_time) * 1000)

        result["success"] = True
        result["response"] = response.choices[0].message.content
        result["latency_ms"] = latency_ms
        result["input_tokens"] = response.usage.prompt_tokens
        result["output_tokens"] = response.usage.completion_tokens

    except Exception as e:
        result["error"] = str(e)
        result["latency_ms"] = int((time.time() - start_time) * 1000)

    return result


def test_text_model(
    client: Groq,
    model_id: str,
    prompt: str,
    context: str = ""
) -> dict:
    """
    Test a text-only model for comparison.
    """
    result = {
        "model": model_id,
        "prompt_type": "text_only",
        "success": False,
        "response": None,
        "latency_ms": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "error": None,
    }

    full_prompt = prompt
    if context:
        full_prompt = f"{context}\n\n{prompt}"

    messages = [{"role": "user", "content": full_prompt}]

    start_time = time.time()
    try:
        response = client.chat.completions.create(
            model=model_id,
            messages=messages,
            max_tokens=2000,
            temperature=0.1,
        )

        latency_ms = int((time.time() - start_time) * 1000)

        result["success"] = True
        result["response"] = response.choices[0].message.content
        result["latency_ms"] = latency_ms
        result["input_tokens"] = response.usage.prompt_tokens
        result["output_tokens"] = response.usage.completion_tokens

    except Exception as e:
        result["error"] = str(e)
        result["latency_ms"] = int((time.time() - start_time) * 1000)

    return result


def calculate_cost(model_id: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate cost in cents based on model pricing."""
    # Pricing per million tokens (in cents)
    PRICING = {
        "meta-llama/llama-4-scout-17b-16e-instruct": {"input": 11, "output": 34},
        "meta-llama/llama-4-maverick-17b-128e-instruct": {"input": 50, "output": 77},
        "llama-3.3-70b-versatile": {"input": 59, "output": 79},
    }

    if model_id not in PRICING:
        return 0.0

    pricing = PRICING[model_id]
    cost_cents = (
        (input_tokens / 1_000_000) * pricing["input"] +
        (output_tokens / 1_000_000) * pricing["output"]
    )
    return round(cost_cents, 4)


def print_result(result: dict, show_response: bool = True):
    """Pretty print a test result."""
    status = "SUCCESS" if result["success"] else "FAILED"
    print(f"\n{'='*60}")
    print(f"Model: {result['model']}")
    print(f"Prompt Type: {result['prompt_type']}")
    print(f"Status: {status}")
    print(f"Latency: {result['latency_ms']}ms")

    if result["success"]:
        print(f"Input Tokens: {result['input_tokens']}")
        print(f"Output Tokens: {result['output_tokens']}")
        cost = calculate_cost(result["model"], result["input_tokens"], result["output_tokens"])
        print(f"Estimated Cost: {cost} cents")

        if show_response:
            print(f"\nResponse:\n{'-'*40}")
            print(result["response"][:1500] + "..." if len(result["response"]) > 1500 else result["response"])
    else:
        print(f"Error: {result['error']}")

    print(f"{'='*60}\n")


def run_evaluation(image_path: str):
    """Run full evaluation with an image."""
    print(f"\nLlama 4 Vision Evaluation")
    print(f"Image: {image_path}")
    print(f"File size: {os.path.getsize(image_path) / 1024:.1f} KB")
    print("="*60)

    client = Groq(api_key=GROQ_API_KEY)
    results = []

    # Test 1: Llama 4 Scout with document OCR prompt
    print("\n[Test 1] Llama 4 Scout - Document OCR")
    result = test_vision_model(
        client,
        MODELS["llama4_scout"],
        image_path,
        TEST_PROMPTS["document_ocr"],
        "document_ocr"
    )
    print_result(result)
    results.append(result)

    # Test 2: Llama 4 Scout with general description
    print("\n[Test 2] Llama 4 Scout - General Description")
    result = test_vision_model(
        client,
        MODELS["llama4_scout"],
        image_path,
        TEST_PROMPTS["general_describe"],
        "general_describe"
    )
    print_result(result)
    results.append(result)

    # Test 3: Llama 4 Maverick with document OCR (if larger model needed)
    print("\n[Test 3] Llama 4 Maverick - Document OCR")
    result = test_vision_model(
        client,
        MODELS["llama4_maverick"],
        image_path,
        TEST_PROMPTS["document_ocr"],
        "document_ocr"
    )
    print_result(result)
    results.append(result)

    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)

    successful = [r for r in results if r["success"]]
    if successful:
        avg_latency = sum(r["latency_ms"] for r in successful) / len(successful)
        total_cost = sum(
            calculate_cost(r["model"], r["input_tokens"], r["output_tokens"])
            for r in successful
        )

        print(f"Successful tests: {len(successful)}/{len(results)}")
        print(f"Average latency: {avg_latency:.0f}ms")
        print(f"Total cost: {total_cost:.4f} cents")

        # Model comparison
        print("\nModel Comparison:")
        for r in successful:
            cost = calculate_cost(r["model"], r["input_tokens"], r["output_tokens"])
            model_name = r["model"].split("/")[-1] if "/" in r["model"] else r["model"]
            print(f"  {model_name}: {r['latency_ms']}ms, {cost:.4f}c")

    return results


def create_sample_test_image():
    """Create a simple test image with text if no image provided."""
    try:
        from PIL import Image, ImageDraw, ImageFont

        # Create a simple document-like image
        img = Image.new('RGB', (800, 600), color='white')
        draw = ImageDraw.Draw(img)

        # Add some text
        text_lines = [
            "INVOICE #12345",
            "Date: December 7, 2025",
            "",
            "Customer: John Smith",
            "Email: john@example.com",
            "",
            "Items:",
            "  1. Widget A - $29.99",
            "  2. Widget B - $49.99",
            "  3. Service Fee - $10.00",
            "",
            "Subtotal: $89.98",
            "Tax (8%): $7.20",
            "TOTAL: $97.18",
        ]

        y = 50
        for line in text_lines:
            draw.text((50, y), line, fill='black')
            y += 30

        # Save
        test_path = Path(__file__).parent / "test_invoice.png"
        img.save(test_path)
        print(f"Created test image: {test_path}")
        return str(test_path)

    except ImportError:
        print("PIL not available, cannot create test image")
        return None


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test Llama 4 Vision capabilities")
    parser.add_argument("--image", type=str, help="Path to test image")
    parser.add_argument("--create-test", action="store_true", help="Create a test image")
    args = parser.parse_args()

    if args.create_test:
        test_path = create_sample_test_image()
        if test_path:
            args.image = test_path

    if not args.image:
        # Look for existing test images
        script_dir = Path(__file__).parent
        possible_images = list(script_dir.glob("*.png")) + list(script_dir.glob("*.jpg"))

        if possible_images:
            args.image = str(possible_images[0])
            print(f"Using existing image: {args.image}")
        else:
            print("No image provided. Use --image PATH or --create-test")
            print("\nQuick test with text-only model to verify API connection:")

            client = Groq(api_key=GROQ_API_KEY)
            result = test_text_model(
                client,
                MODELS["llama33_70b"],
                "What is 2+2? Reply with just the number."
            )
            print_result(result, show_response=True)
            sys.exit(0)

    if not os.path.exists(args.image):
        print(f"Error: Image not found: {args.image}")
        sys.exit(1)

    run_evaluation(args.image)
