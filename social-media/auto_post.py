#!/usr/bin/env python3
"""Free-tier Bhadaa social posting: python social-media/auto_post.py prepare|publish."""
import json
import os
import re
import sys
from datetime import datetime, timedelta, time, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
DAY = datetime.now(ZoneInfo("Asia/Kolkata")).date()
CONTENT = ROOT / "content" / f"{DAY.isoformat()}.json"
IMAGE = ROOT / "generated" / f"{DAY.isoformat()}.png"
MODEL = "gemini-3.5-flash-lite"
REPO = "Feneel518/bhada"
TOPICS = [
    "late rent follow-up without awkwardness",
    "tracking multiple tenants in different units",
    "rent due date confusion",
    "one place for properties, units, and tenants",
    "switching from paper registers to simple rent tracking",
    "checking which monthly rent is collected",
    "reducing spreadsheet mistakes in rent records",
    "when a landlord has more than one property",
    "organizing tenant details",
    "staying consistent with rent records",
    "how landlords can review monthly collections",
    "a simple rent-management routine",
]
MUTATION = """
mutation Create($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id dueAt } }
    ... on MutationError { message }
  }
}
"""


def post_json(url, headers, body):
    response = requests.post(url, headers=headers, json=body, timeout=40)
    response.raise_for_status()
    return response.json()


def prior_headlines():
    files = sorted((ROOT / "content").glob("*.json"), reverse=True)[:30]
    out = []
    for item in files:
        try:
            if item != CONTENT:
                out.append(json.loads(item.read_text(encoding="utf-8"))["headline"])
        except (ValueError, KeyError):
            continue
    return out


def make_copy():
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise RuntimeError("GEMINI_API_KEY is missing; no content will be scheduled.")
    topic = TOPICS[DAY.toordinal() % len(TOPICS)]
    seen = prior_headlines()
    prompt = f"""Create original social content for Bhadaa.in, an Indian rent-management web app.
VERIFIED product capabilities ONLY: organizing properties, units, tenants, monthly rents and rent due days.
Audience: small Indian landlords and owners of multiple rental units.
Topic today: {topic}
Recently published headlines (avoid similar language): {seen}
Give useful, practical education. Friendly, Indian English with occasional Roman Hinglish. No fabricated
statistics, customer stories, legal/tax claims, fake testimonials, guarantees, prices, discounts, or
product features beyond verified facts. Never imply that Bhadaa collects payments automatically,
messages tenants, integrates with UPI, or promises financial outcomes.
Write TWO DISTINCT X posts and ONE Instagram caption, not duplicates or barely rewritten versions.
Include an occasional subtle CTA to https://bhadaa.in, not hard-sell every sentence.
Return only a JSON object with exactly these keys:
"headline": short punchy ASCII-only headline (maximum 48 characters, no emoji),
"x_morning": distinct X post <= 245 characters,
"x_evening": distinct X post <= 245 characters,
"instagram_caption": educational caption <= 900 characters with 2-4 fitting hashtags.
Keep the headline visually useful; no clickbait. Do not return Markdown."""
    for attempt in range(3):
        body = {
            "contents": [{"parts": [{"text": prompt + f"\nVariation: {attempt}"}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.85},
        }
        data = post_json(
            f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
            {"x-goog-api-key": key, "Content-Type": "application/json"},
            body,
        )
        raw = "".join(
            part.get("text", "") for part in data["candidates"][0]["content"]["parts"]
        )
        result = json.loads(raw)
        keys = ("headline", "x_morning", "x_evening", "instagram_caption")
        if not all(isinstance(result.get(k), str) and result[k].strip() for k in keys):
            continue
        title = result["headline"].strip()
        if len(title) > 48 or not title.isascii() or title.lower() in [s.lower() for s in seen]:
            continue
        if len(result["x_morning"]) > 245 or len(result["x_evening"]) > 245:
            continue
        if len(result["instagram_caption"]) > 900:
            continue
        if result["x_morning"].strip() == result["x_evening"].strip():
            continue
        combined = " ".join(result[k] for k in keys)
        if re.search(r"\b(guaranteed|GST|TDS|automatic payments|free forever|UPI integration|10x|100%)\b", combined, flags=re.I):
            continue
        return {k: result[k].strip() for k in keys}
    raise RuntimeError("Gemini returned invalid or repetitive content 3 times; skipping to avoid low-quality posting.")


def font(size, bold=False):
    folder = "/usr/share/fonts/truetype/dejavu/"
    path = folder + ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
    return ImageFont.truetype(path, size)


def wrap(draw, value, f, max_width):
    lines, line = [], ""
    for word in value.split():
        candidate = (line + " " + word).strip()
        if draw.textbbox((0, 0), candidate, font=f)[2] <= max_width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def make_image(headline, topic):
    image = Image.new("RGB", (1080, 1350), "#0C1535")
    d = ImageDraw.Draw(image)
    d.ellipse((750, -230, 1300, 320), fill="#173E97")
    d.ellipse((-300, 1000, 250, 1500), fill="#112A6F")
    d.rounded_rectangle((78, 68, 340, 129), radius=28, fill="#2C60E8")
    d.text((106, 84), "BHADAA.IN", fill="#FFFFFF", font=font(27, bold=True))
    d.text((78, 272), "BETTER RENT ROUTINES", fill="#93B7FF", font=font(32, bold=True))
    fontsize = 88
    for candidate in range(88, 44, -2):
        f = font(candidate, bold=True)
        lines = wrap(d, headline, f, 910)
        if len(lines) <= 4:
            fontsize = candidate
            break
    f = font(fontsize, bold=True)
    lines = wrap(d, headline, f, 910)
    y = 385
    for line in lines:
        d.text((78, y), line, font=f, fill="#FFFFFF")
        y += fontsize + 26
    d.rounded_rectangle((78, 1070, 1002, 1075), radius=2, fill="#3959AE")
    d.text((78, 1130), "Organize properties. Track rent.", fill="#C7D8FE", font=font(30))
    d.text((78, 1200), "bhadaa.in", fill="#FFFFFF", font=font(36, bold=True))
    IMAGE.parent.mkdir(parents=True, exist_ok=True)
    image.save(IMAGE, format="PNG", optimize=True)


def prepare():
    if CONTENT.exists() and IMAGE.exists():
        print(f"Already prepared {DAY}; reusing existing content.")
        return
    copy = make_copy()
    copy.update({"date": DAY.isoformat(), "brand": "Bhadaa.in", "published": {}})
    make_image(copy["headline"], TOPICS[DAY.toordinal() % len(TOPICS)])
    CONTENT.parent.mkdir(parents=True, exist_ok=True)
    CONTENT.write_text(json.dumps(copy, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {CONTENT} and {IMAGE}; not yet published.")


def buffer_create(payload):
    token = os.environ.get("BUFFER_API_KEY", "")
    if not token:
        raise RuntimeError("BUFFER_API_KEY missing.")
    data = post_json(
        "https://api.buffer.com",
        {"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        {"query": MUTATION, "variables": {"input": payload}},
    )
    if data.get("errors"):
        raise RuntimeError("Buffer GraphQL rejected request: " + str(data["errors"]))
    result = data.get("data", {}).get("createPost", {})
    if result.get("message"):
        raise RuntimeError("Buffer: " + result["message"])
    if not result.get("post", {}).get("id"):
        raise RuntimeError("Buffer did not confirm scheduling.")
    return result["post"]


def publish():
    if os.environ.get("AUTOPOST_ENABLED", "").lower() != "true":
        print("AUTOPOST_ENABLED is not true; no API publishing.")
        return
    if not CONTENT.exists() or not IMAGE.exists():
        raise RuntimeError("Content/media missing. Run 'prepare' first.")
    data = json.loads(CONTENT.read_text(encoding="utf-8"))
    image_url = f"https://raw.githubusercontent.com/{REPO}/main/social-media/generated/{DAY.isoformat()}.png"
    check = requests.get(image_url, timeout=25)
    check.raise_for_status()
    if not check.content.startswith(b"\x89PNG"):
        raise RuntimeError("Public image URL did not return PNG bytes; skipping all posts.")
    now = datetime.now(timezone.utc)
    channels = {
        "x_morning": os.environ.get("BUFFER_X_CHANNEL_ID", ""),
        "instagram": os.environ.get("BUFFER_INSTAGRAM_CHANNEL_ID", ""),
        "x_evening": os.environ.get("BUFFER_X_CHANNEL_ID", ""),
    }
    items = [
        ("x_morning", data["x_morning"], 10, 0),
        ("instagram", data["instagram_caption"], 14, 0),
        ("x_evening", data["x_evening"], 19, 0),
    ]
    failures = []
    for key, caption, hour, minute in items:
        if data.setdefault("published", {}).get(key):
            print(f"Skipping {key}: already registered as scheduled.")
            continue
        if not channels[key]:
            failures.append(f"{key}: missing Buffer channel ID")
            continue
        due = datetime.combine(DAY, time(hour, minute), tzinfo=ZoneInfo("Asia/Kolkata")).astimezone(timezone.utc)
        if due <= now + timedelta(minutes=20):
            print(f"Skipping {key}: scheduled time already passed.")
            continue
        payload = {
            "text": caption,
            "channelId": channels[key],
            "schedulingType": "automatic",
            "mode": "customScheduled",
            "dueAt": due.isoformat().replace("+00:00", "Z"),
            "aiAssisted": True,
            "assets": [],
            "needsApproval": False,
        }
        if key == "instagram":
            payload["assets"] = [{"image": {"url": image_url}}]
        try:
            result = buffer_create(payload)
            data["published"][key] = {"id": result["id"], "dueAt": result.get("dueAt")}
            print(f"Scheduled {key} at {due.isoformat()}, Buffer ID {result['id']}")
        except (requests.RequestException, ValueError, RuntimeError) as exc:
            failures.append(f"{key}: {exc}")
        finally:
            CONTENT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if failures:
        raise RuntimeError("Some posts were not scheduled: " + " | ".join(failures))


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    if command == "prepare":
        prepare()
    elif command == "publish":
        publish()
    else:
        raise SystemExit("Usage: python social-media/auto_post.py prepare|publish")
