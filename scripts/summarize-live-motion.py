import json
import math
import re
import sys
from pathlib import Path


source = Path(sys.argv[1] if len(sys.argv) > 1 else "motion-analysis/live-inspection.json")
target = Path(sys.argv[2] if len(sys.argv) > 2 else "motion-analysis/live-summary.json")
data = json.loads(source.read_text(encoding="utf-8"))


def brief_value(value):
    if not isinstance(value, list):
        return {"count": 1, "first": value, "mid": value, "last": value}
    count = len(value)
    if not count:
        return {"count": 0, "first": None, "mid": None, "last": None}
    return {
        "count": count,
        "first": value[0],
        "p25": value[round((count - 1) * 0.25)],
        "mid": value[round((count - 1) * 0.5)],
        "p75": value[round((count - 1) * 0.75)],
        "last": value[-1],
    }


calls = []
for call in data.get("capturedAnimateCalls", []):
    keyframes = call.get("keyframes")
    if isinstance(keyframes, dict):
        props = {key: brief_value(value) for key, value in keyframes.items()}
    elif isinstance(keyframes, list):
        keys = sorted({key for frame in keyframes if isinstance(frame, dict) for key in frame if key not in {"offset", "easing", "composite"}})
        props = {key: brief_value([frame.get(key) for frame in keyframes]) for key in keys}
    else:
        props = {"value": brief_value(keyframes)}
    calls.append({
        "atMs": call.get("atMs"),
        "tag": call.get("tag"),
        "text": call.get("text"),
        "className": call.get("className"),
        "options": call.get("options"),
        "properties": props,
    })


sticky = []
for snap in data.get("scrollSnapshots", []):
    for item in snap.get("stickyFixed", []):
        if item.get("position") == "sticky":
            sticky.append({"scrollY": snap.get("y"), **item})


active_events = []
for snap in data.get("scrollSnapshots", []):
    if snap.get("activeAnimations"):
        active_events.append({
            "scrollY": snap.get("y"),
            "visibleHeadings": snap.get("visibleHeadings"),
            "animations": snap.get("activeAnimations"),
        })


resource_names = []
for item in data.get("responses", []):
    url = item.get("url", "")
    resource_names.append({"type": item.get("type"), "status": item.get("status"), "url": url})


summary = {
    "source": str(source),
    "page": data.get("base", {}).get("page"),
    "viewport": data.get("base", {}).get("viewport"),
    "headings": data.get("base", {}).get("headings"),
    "rootComputed": data.get("base", {}).get("rootComputed"),
    "animationCalls": calls,
    "stickySamples": sticky,
    "activeScrollEvents": active_events,
    "resources": resource_names,
    "consoleMessages": data.get("consoleMessages"),
    "pageErrors": data.get("pageErrors"),
}
target.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps({
    "output": str(target),
    "animationCalls": len(calls),
    "stickySamples": len(sticky),
    "activeScrollEvents": len(active_events),
    "resources": len(resource_names),
}, indent=2))
