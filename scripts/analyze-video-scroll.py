import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np


VIDEO_CHROME_PX = 88
CAPTURE_WIDTH_PX = 1920
CAPTURE_HEIGHT_PX = 1060
DEVICE_VIEWPORT_HEIGHT_PX = CAPTURE_HEIGHT_PX - VIDEO_CHROME_PX
REFERENCE_PAGE_HEIGHT_CSS = 11835
EXPECTED_ZOOM = 0.75
CSS_VIEWPORT_WIDTH = round(CAPTURE_WIDTH_PX / EXPECTED_ZOOM)
CSS_VIEWPORT_HEIGHT = round(DEVICE_VIEWPORT_HEIGHT_PX / EXPECTED_ZOOM)


def contiguous_runs(indices):
    if len(indices) == 0:
        return []
    runs = []
    start = previous = int(indices[0])
    for value in indices[1:]:
        value = int(value)
        if value > previous + 1:
            runs.append((start, previous))
            start = value
        previous = value
    runs.append((start, previous))
    return runs


def interpolate_missing(values):
    values = np.asarray(values, dtype=np.float64)
    indices = np.arange(len(values))
    valid = np.isfinite(values)
    if not valid.any():
        raise RuntimeError("No scrollbar positions could be detected")
    return np.interp(indices, indices[valid], values[valid])


def rolling_median(values, radius=2):
    values = np.asarray(values, dtype=np.float64)
    result = np.empty_like(values)
    for index in range(len(values)):
        result[index] = np.median(values[max(0, index - radius): min(len(values), index + radius + 1)])
    return result


def closest_time(samples, target_scroll, direction=None):
    candidates = samples
    if direction == "down":
        candidates = [sample for sample in samples if sample["direction"] in {"down", "pause"} and sample["timeMs"] < 47500]
    elif direction == "up":
        candidates = [sample for sample in samples if sample["timeMs"] >= 46500]
    if not candidates:
        return None
    return min(candidates, key=lambda item: abs(item["scrollYCss"] - target_scroll))


def main():
    video_path = Path(sys.argv[1] if len(sys.argv) > 1 else "motion-analysis/reference.mp4").resolve()
    output_path = Path(sys.argv[2] if len(sys.argv) > 2 else "motion-analysis/video-scroll-timeline.json").resolve()
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError(f"Cannot open {video_path}")
    fps = float(capture.get(cv2.CAP_PROP_FPS))
    raw_tops = []
    raw_lengths = []
    confidences = []
    frame_index = 0
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        strip = frame[VIDEO_CHROME_PX:CAPTURE_HEIGHT_PX, 1912:1917].mean(axis=(1, 2))
        runs = contiguous_runs(np.where(strip > 90)[0])
        candidates = []
        for start, end in runs:
            length = end - start + 1
            if length >= 45:
                candidates.append((length, float(strip[start:end + 1].mean()), start, end))
        if candidates:
            length, confidence, start, end = max(candidates, key=lambda item: (item[0], item[1]))
            raw_tops.append(float(start))
            raw_lengths.append(float(length))
            confidences.append(confidence)
        else:
            raw_tops.append(float("nan"))
            raw_lengths.append(float("nan"))
            confidences.append(0.0)
        frame_index += 1
    capture.release()

    tops = rolling_median(interpolate_missing(raw_tops), 2)
    lengths = interpolate_missing(raw_lengths)
    stable_lengths = lengths[(lengths >= 70) & (lengths <= 125)]
    thumb_length = float(np.median(stable_lengths))
    # The recording reaches the absolute bottom, so the largest observed thumb top is
    # a stronger calibration than the antialiased thumb length (which is clipped at the ends).
    travel_px = float(np.max(tops))
    scroll_max_css = REFERENCE_PAGE_HEIGHT_CSS - CSS_VIEWPORT_HEIGHT
    scroll_positions = np.clip(tops / travel_px * scroll_max_css, 0, scroll_max_css)

    # Speed is measured over a 200 ms baseline to suppress one-pixel scrollbar quantization.
    delta_frames = max(1, round(fps * 0.2))
    speeds = np.zeros_like(scroll_positions)
    for index in range(len(scroll_positions)):
        left = max(0, index - delta_frames)
        right = min(len(scroll_positions) - 1, index + delta_frames)
        elapsed = (right - left) / fps
        speeds[index] = (scroll_positions[right] - scroll_positions[left]) / max(elapsed, 1 / fps)

    samples = []
    every = max(1, round(fps / 10))
    for index in range(0, len(scroll_positions), every):
        speed = float(speeds[index])
        direction = "down" if speed > 80 else "up" if speed < -80 else "pause"
        samples.append({
            "frame": index,
            "timeMs": round(index / fps * 1000, 3),
            "thumbTopPx": round(float(tops[index]), 2),
            "scrollYCss": round(float(scroll_positions[index]), 2),
            "speedCssPxPerSecond": round(speed, 2),
            "direction": direction,
        })

    max_index = int(np.argmax(scroll_positions))
    moving = np.where(tops > 0.5)[0]
    first_move_index = int(moving[0]) if len(moving) else 0
    near_bottom = np.where(scroll_positions > scroll_max_css * 0.985)[0]
    bottom_index = int(near_bottom[0]) if len(near_bottom) else max_index
    reverse_candidates = np.where((np.arange(len(speeds)) > bottom_index) & (speeds < -300))[0]
    reverse_index = int(reverse_candidates[0]) if len(reverse_candidates) else max_index

    headings = {
        "hero": 248.0,
        "features": 2190.59,
        "how": 4082.58,
        "benefits": 6797.16,
        "testimonials": 7786.73,
        "insights": 8795.31,
        "cta": 9797.7,
        "faq": 10344.89,
        "footerTrial": 11242.84,
    }
    crossings = {}
    for name, document_y in headings.items():
        center_target = max(0, min(scroll_max_css, document_y - CSS_VIEWPORT_HEIGHT * 0.5))
        top_target = max(0, min(scroll_max_css, document_y - 160))
        down_center = closest_time(samples, center_target, "down")
        down_top = closest_time(samples, top_target, "down")
        up_center = closest_time(samples, center_target, "up")
        crossings[name] = {
            "documentYCss": document_y,
            "centerScrollTargetCss": round(center_target, 2),
            "topScrollTargetCss": round(top_target, 2),
            "downCenterTimeMs": down_center["timeMs"] if down_center else None,
            "downTopTimeMs": down_top["timeMs"] if down_top else None,
            "upCenterTimeMs": up_center["timeMs"] if up_center else None,
        }

    result = {
        "video": str(video_path),
        "fps": fps,
        "decodedFrames": frame_index,
        "capture": {"widthPx": CAPTURE_WIDTH_PX, "heightPx": CAPTURE_HEIGHT_PX, "browserChromePx": VIDEO_CHROME_PX, "deviceViewportHeightPx": DEVICE_VIEWPORT_HEIGHT_PX},
        "inferredBrowser": {
            "pageZoom": EXPECTED_ZOOM,
            "pageZoomPercent": int(EXPECTED_ZOOM * 100),
            "effectiveCssViewport": {"width": CSS_VIEWPORT_WIDTH, "height": CSS_VIEWPORT_HEIGHT},
            "referencePageHeightCss": REFERENCE_PAGE_HEIGHT_CSS,
            "evidence": "A ~108 px moving scrollbar thumb in a 972 px viewport matches the 1296/11835 ratio at 75% page zoom; the 1136 CSS px content rail measures ~852 device px = 1136 × 0.75.",
        },
        "scrollbarCalibration": {
            "medianThumbLengthPx": round(thumb_length, 3),
            "thumbTravelPx": round(travel_px, 3),
            "scrollMaxCss": scroll_max_css,
            "cssScrollPerThumbPx": round(scroll_max_css / travel_px, 5),
            "detectedFramePercent": round(np.isfinite(raw_tops).sum() / max(len(raw_tops), 1) * 100, 3),
            "medianDetectionLuma": round(float(np.median([value for value in confidences if value > 0])), 3),
        },
        "events": {
            "firstScroll": {"frame": first_move_index, "timeMs": round(first_move_index / fps * 1000, 3), "scrollYCss": round(float(scroll_positions[first_move_index]), 2)},
            "firstNearBottom": {"frame": bottom_index, "timeMs": round(bottom_index / fps * 1000, 3), "scrollYCss": round(float(scroll_positions[bottom_index]), 2)},
            "maxScroll": {"frame": max_index, "timeMs": round(max_index / fps * 1000, 3), "scrollYCss": round(float(scroll_positions[max_index]), 2)},
            "reverseStarts": {"frame": reverse_index, "timeMs": round(reverse_index / fps * 1000, 3), "scrollYCss": round(float(scroll_positions[reverse_index]), 2)},
            "maxDownSpeedCssPxPerSecond": round(float(np.max(speeds)), 2),
            "maxUpSpeedCssPxPerSecond": round(float(np.min(speeds)), 2),
        },
        "headingCrossings": crossings,
        "samples100ms": samples,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "output": str(output_path),
        "thumbLength": result["scrollbarCalibration"]["medianThumbLengthPx"],
        "detectedPercent": result["scrollbarCalibration"]["detectedFramePercent"],
        "events": result["events"],
        "crossings": result["headingCrossings"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
