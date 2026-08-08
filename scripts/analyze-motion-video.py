import json
import math
import os
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


def timestamp_label(ms: float) -> str:
    total_seconds = ms / 1000
    minutes = int(total_seconds // 60)
    seconds = total_seconds - minutes * 60
    return f"{minutes:02d}:{seconds:06.3f}"


def main() -> None:
    video_path = Path(sys.argv[1] if len(sys.argv) > 1 else "motion-analysis/reference.mp4").resolve()
    output_root = Path(sys.argv[2] if len(sys.argv) > 2 else "motion-analysis").resolve()
    frames_root = output_root / "frames" / "general"
    frames_root.mkdir(parents=True, exist_ok=True)

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError(f"OpenCV could not open {video_path}")

    fps = float(capture.get(cv2.CAP_PROP_FPS))
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    bitrate_kbps = float(capture.get(cv2.CAP_PROP_BITRATE))
    fourcc_int = int(capture.get(cv2.CAP_PROP_FOURCC))
    fourcc = "".join(chr((fourcc_int >> (8 * i)) & 0xFF) for i in range(4))
    duration_ms = frame_count / fps * 1000 if fps else 0

    sample_interval_ms = 2000
    next_sample_ms = 0
    general_frames = []
    diff_samples = []
    exact_duplicates = 0
    near_duplicates = 0
    previous_small = None
    previous_frame = None
    frame_index = 0

    while True:
        ok, frame = capture.read()
        if not ok:
            break
        time_ms = frame_index / fps * 1000 if fps else capture.get(cv2.CAP_PROP_POS_MSEC)
        small = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (320, 177), interpolation=cv2.INTER_AREA)
        if previous_small is not None:
            mean_delta = float(np.mean(cv2.absdiff(small, previous_small)))
            diff_samples.append({"frame": frame_index, "timeMs": round(time_ms, 3), "meanAbsDelta": mean_delta})
            if mean_delta < 0.02:
                exact_duplicates += 1
            elif mean_delta < 0.3:
                near_duplicates += 1
        previous_small = small

        if time_ms + (500 / max(fps, 1)) >= next_sample_ms:
            scaled_width = 960
            scaled_height = round(height * scaled_width / width)
            scaled = cv2.resize(frame, (scaled_width, scaled_height), interpolation=cv2.INTER_AREA)
            frame_file = frames_root / f"frame-{round(time_ms):06d}.png"
            cv2.imwrite(str(frame_file), scaled)
            general_frames.append({
                "frame": frame_index,
                "timeMs": round(time_ms),
                "timestamp": timestamp_label(time_ms),
                "file": frame_file.relative_to(output_root).as_posix(),
            })
            next_sample_ms += sample_interval_ms
        previous_frame = frame
        frame_index += 1

    capture.release()

    if previous_frame is not None and (not general_frames or general_frames[-1]["frame"] != frame_index - 1):
        time_ms = (frame_index - 1) / fps * 1000 if fps else duration_ms
        scaled_width = 960
        scaled_height = round(height * scaled_width / width)
        scaled = cv2.resize(previous_frame, (scaled_width, scaled_height), interpolation=cv2.INTER_AREA)
        frame_file = frames_root / f"frame-{round(time_ms):06d}.png"
        cv2.imwrite(str(frame_file), scaled)
        general_frames.append({
            "frame": frame_index - 1,
            "timeMs": round(time_ms),
            "timestamp": timestamp_label(time_ms),
            "file": frame_file.relative_to(output_root).as_posix(),
        })

    deltas = np.array([sample["meanAbsDelta"] for sample in diff_samples], dtype=np.float64)
    percentiles = {str(p): float(np.percentile(deltas, p)) for p in [50, 75, 90, 95, 99]} if len(deltas) else {}
    high_change_threshold = max(percentiles.get("99", 0), 8.0)
    high_change_candidates = sorted(
        [sample for sample in diff_samples if sample["meanAbsDelta"] >= high_change_threshold],
        key=lambda item: item["meanAbsDelta"],
        reverse=True,
    )[:30]

    thumb_width = 456
    thumb_height = round(height * thumb_width / width)
    label_height = 30
    columns = 4
    rows = math.ceil(len(general_frames) / columns)
    sheet = Image.new("RGB", (columns * thumb_width, rows * (thumb_height + label_height)), "#05060d")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, entry in enumerate(general_frames):
        image = Image.open(output_root / entry["file"]).convert("RGB")
        image.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
        x = (index % columns) * thumb_width
        y = (index // columns) * (thumb_height + label_height)
        sheet.paste(image, (x, y))
        draw.rectangle((x, y + thumb_height, x + thumb_width, y + thumb_height + label_height), fill="#05060d")
        draw.text((x + 8, y + thumb_height + 8), f"{entry['timestamp']}  frame {entry['frame']}", fill="#ffffff", font=font)
    contact_sheet_path = output_root / "general-contact-sheet.jpg"
    sheet.save(contact_sheet_path, quality=90, optimize=True)

    result = {
        "videoFile": str(video_path),
        "fileSizeBytes": video_path.stat().st_size,
        "codecFourCC": fourcc,
        "width": width,
        "height": height,
        "fps": fps,
        "decodedFrameCount": frame_index,
        "containerFrameCount": frame_count,
        "durationMs": duration_ms,
        "bitrateKbpsFromOpenCV": bitrate_kbps,
        "sampleIntervalMs": sample_interval_ms,
        "generalFrames": general_frames,
        "contactSheet": contact_sheet_path.relative_to(output_root).as_posix(),
        "duplicateAnalysis": {
            "exactConsecutiveDuplicates": exact_duplicates,
            "nearConsecutiveDuplicates": near_duplicates,
            "exactPercent": exact_duplicates / max(frame_index - 1, 1) * 100,
            "nearPercent": near_duplicates / max(frame_index - 1, 1) * 100,
            "meanAbsDeltaPercentiles": percentiles,
        },
        "highChangeCandidates": high_change_candidates,
    }
    with (output_root / "video-metadata.json").open("w", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
