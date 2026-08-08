import json
import math
import sys
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont


def label(ms):
    return f"{int(ms // 60000):02d}:{(ms % 60000) / 1000:06.3f}"


def main():
    video = Path(sys.argv[1] if len(sys.argv) > 1 else "motion-analysis/reference.mp4").resolve()
    config = Path(sys.argv[2] if len(sys.argv) > 2 else "motion-analysis/sequence-ranges.json").resolve()
    root = Path(sys.argv[3] if len(sys.argv) > 3 else "motion-analysis").resolve()
    ranges = json.loads(config.read_text(encoding="utf-8"))
    cap = cv2.VideoCapture(str(video))
    fps = float(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    output = []
    for item in ranges:
        name = item["name"]
        start_ms = item["startMs"]
        end_ms = item["endMs"]
        interval_ms = item.get("intervalMs", 100)
        crop = item.get("crop", [0, 0, width, height])
        x, y, w, h = crop
        directory = root / "frames" / "critical" / name
        directory.mkdir(parents=True, exist_ok=True)
        entries = []
        time_ms = start_ms
        while time_ms <= end_ms + 0.01:
            frame_no = round(time_ms / 1000 * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
            ok, frame = cap.read()
            if not ok:
                break
            frame = frame[y:y + h, x:x + w]
            scaled_w = min(960, w)
            scaled_h = round(h * scaled_w / w)
            frame = cv2.resize(frame, (scaled_w, scaled_h), interpolation=cv2.INTER_AREA)
            file = directory / f"{round(time_ms):06d}.jpg"
            cv2.imwrite(str(file), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
            entries.append({"timeMs": round(time_ms), "frame": frame_no, "file": file.relative_to(root).as_posix()})
            time_ms += interval_ms

        thumb_w = item.get("thumbWidth", 360)
        thumb_h = round(h * thumb_w / w)
        label_h = 26
        cols = item.get("columns", 4)
        rows = math.ceil(len(entries) / cols)
        sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "#05060d")
        draw = ImageDraw.Draw(sheet)
        font = ImageFont.load_default()
        for index, entry in enumerate(entries):
            image = Image.open(root / entry["file"]).convert("RGB")
            image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
            px = index % cols * thumb_w
            py = index // cols * (thumb_h + label_h)
            sheet.paste(image, (px, py))
            draw.text((px + 7, py + thumb_h + 7), f"{label(entry['timeMs'])} f{entry['frame']}", fill="white", font=font)
        sheet_file = root / f"contact-{name}.jpg"
        sheet.save(sheet_file, quality=91, optimize=True)
        output.append({**item, "frames": entries, "contactSheet": sheet_file.relative_to(root).as_posix()})
    cap.release()
    manifest = root / "critical-sequences.json"
    manifest.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"manifest": str(manifest), "sequences": [{"name": item["name"], "frames": len(item["frames"]), "contactSheet": item["contactSheet"]} for item in output]}, indent=2))


if __name__ == "__main__":
    main()
