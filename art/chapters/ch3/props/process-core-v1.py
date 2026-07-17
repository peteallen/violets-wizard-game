#!/usr/bin/env python3
"""Deterministically isolate and ship the reviewed Chapter Three prop sheet."""

from __future__ import annotations

import argparse
from collections import deque
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from typing import Any

import PIL
from PIL import Image


ROOT = Path(__file__).resolve().parents[4]
DEFAULT_SPEC = Path(__file__).with_name("core-v1.processing.json")
EXPECTED_IDS = (
    "spellbook-parcel",
    "lantern",
    "feather",
    "wet-footprints",
    "ribbon-clue",
    "reflected-eyes",
    "torn-book",
    "toad-token",
    "sleeping-star",
)
EXPECTED_OUTPUT_DIRECTORY = Path("public/assets/art/props/ch3")


def fail(message: str) -> None:
    raise RuntimeError(f"Chapter Three prop processing failed: {message}")


def digest(data: bytes) -> str:
    return sha256(data).hexdigest()


def canonical_json(value: Any) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode("utf-8")


def repo_path(raw: str, label: str) -> Path:
    if not isinstance(raw, str) or not raw or raw.startswith("/") or "\\" in raw:
        fail(f"{label} must be a non-empty repository-relative POSIX path")
    absolute = (ROOT / raw).resolve()
    if absolute != ROOT and ROOT not in absolute.parents:
        fail(f"{label} escapes the repository: {raw}")
    return absolute


def relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def require_integer(value: Any, label: str, minimum: int, maximum: int) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or not minimum <= value <= maximum:
        fail(f"{label} must be an integer from {minimum} through {maximum}")
    return value


def require_exact_keys(value: dict[str, Any], expected: set[str], label: str) -> None:
    actual = set(value)
    if actual != expected:
        fail(
            f"{label} keys must be exactly {sorted(expected)}; "
            f"missing {sorted(expected - actual)}, unexpected {sorted(actual - expected)}"
        )


def require_object(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(f"{label} must be an object")
    return value


def read_spec(path: Path) -> tuple[dict[str, Any], bytes]:
    try:
        spec_bytes = path.read_bytes()
        spec = json.loads(spec_bytes)
    except (OSError, json.JSONDecodeError) as error:
        fail(f"cannot read processing spec {path}: {error}")
    validate_spec(spec)
    return spec, spec_bytes


def validate_spec(spec: dict[str, Any]) -> None:
    require_exact_keys(
        require_object(spec, "spec"),
        {
            "schema_version",
            "id",
            "source",
            "request",
            "alpha",
            "grid",
            "encoding",
            "metadata",
            "assets",
        },
        "spec",
    )
    if spec["schema_version"] != 1 or spec["id"] != "ch3-props-core-v1":
        fail("spec identity must be schema 1 and ch3-props-core-v1")

    source = require_object(spec["source"], "spec.source")
    require_exact_keys(source, {"path", "sha256", "width", "height"}, "spec.source")
    if not re.fullmatch(r"[0-9a-f]{64}", source["sha256"] or ""):
        fail("spec.source.sha256 must be a lowercase SHA-256 digest")
    require_integer(source["width"], "spec.source.width", 1, 8192)
    require_integer(source["height"], "spec.source.height", 1, 8192)
    repo_path(source["path"], "spec.source.path")

    request = require_object(spec["request"], "spec.request")
    require_exact_keys(request, {"path", "order"}, "spec.request")
    repo_path(request["path"], "spec.request.path")
    if tuple(request["order"]) != EXPECTED_IDS:
        fail("spec.request.order must retain the exact generated-sheet request order")

    alpha = require_object(spec["alpha"], "spec.alpha")
    require_exact_keys(
        alpha,
        {
            "helper",
            "arguments",
            "component_alpha_floor",
            "component_min_pixels",
            "maximum_ignored_component_pixels",
        },
        "spec.alpha",
    )
    if alpha["helper"] != "skills/.system/imagegen/scripts/remove_chroma_key.py":
        fail("spec.alpha.helper must name the installed imagegen chroma helper")
    required_arguments = {
        "--auto-key",
        "border",
        "--soft-matte",
        "--transparent-threshold",
        "12",
        "--opaque-threshold",
        "220",
        "--despill",
        "--force",
    }
    if set(alpha["arguments"]) != required_arguments:
        fail("spec.alpha.arguments must retain border auto-keying, 12/220 soft matte, and despill")
    require_integer(alpha["component_alpha_floor"], "spec.alpha.component_alpha_floor", 0, 254)
    require_integer(alpha["component_min_pixels"], "spec.alpha.component_min_pixels", 1, 1_000_000)
    require_integer(
        alpha["maximum_ignored_component_pixels"],
        "spec.alpha.maximum_ignored_component_pixels",
        0,
        10_000,
    )

    grid = require_object(spec["grid"], "spec.grid")
    require_exact_keys(
        grid,
        {"columns", "rows", "equal_boundaries", "accepted_gutter_boundaries", "verified_empty_gutters"},
        "spec.grid",
    )
    if grid["columns"] != 3 or grid["rows"] != 3:
        fail("spec.grid must remain a three-column by three-row sheet")
    equal = require_object(grid["equal_boundaries"], "spec.grid.equal_boundaries")
    accepted = require_object(grid["accepted_gutter_boundaries"], "spec.grid.accepted_gutter_boundaries")
    if equal != {"x": [0, 512, 1024, 1536], "y": [0, 341, 683, 1024]}:
        fail("spec.grid.equal_boundaries must describe the source's mathematical thirds")
    if accepted != {"x": [0, 557, 979, 1536], "y": [0, 391, 669, 1024]}:
        fail("spec.grid.accepted_gutter_boundaries must retain the reviewed empty-gutter cuts")
    if len(grid["verified_empty_gutters"]) != 4:
        fail("spec.grid.verified_empty_gutters must describe both vertical and horizontal cuts")

    encoding = require_object(spec["encoding"], "spec.encoding")
    require_exact_keys(encoding, {"tool", "arguments"}, "spec.encoding")
    if encoding["tool"] != "cwebp" or encoding["arguments"] != [
        "-quiet",
        "-q",
        "90",
        "-alpha_q",
        "100",
        "-m",
        "6",
        "-sharp_yuv",
        "-metadata",
        "none",
    ]:
        fail("spec.encoding must retain the reviewed deterministic cwebp settings")

    metadata = require_object(spec["metadata"], "spec.metadata")
    require_exact_keys(metadata, {"path"}, "spec.metadata")
    repo_path(metadata["path"], "spec.metadata.path")

    if not isinstance(spec["assets"], list) or len(spec["assets"]) != 9:
        fail("spec.assets must contain exactly nine entries")
    seen_outputs: set[str] = set()
    for index, asset_value in enumerate(spec["assets"]):
        label = f"spec.assets[{index}]"
        asset = require_object(asset_value, label)
        require_exact_keys(
            asset,
            {
                "id",
                "key",
                "row",
                "column",
                "crop",
                "expected_components",
                "canvas",
                "maximum_soft_edge_expansion",
                "output",
            },
            label,
        )
        expected_id = EXPECTED_IDS[index]
        if asset["id"] != expected_id or asset["key"] != f"props/ch3/{expected_id}":
            fail(f"{label} must remain the {expected_id} request-order asset")
        if asset["row"] != index // 3 or asset["column"] != index % 3:
            fail(f"{label} row and column do not match request order")
        crop = require_object(asset["crop"], f"{label}.crop")
        require_exact_keys(crop, {"x", "y", "width", "height"}, f"{label}.crop")
        accepted_x = accepted["x"]
        accepted_y = accepted["y"]
        expected_crop = {
            "x": accepted_x[asset["column"]],
            "y": accepted_y[asset["row"]],
            "width": accepted_x[asset["column"] + 1] - accepted_x[asset["column"]],
            "height": accepted_y[asset["row"] + 1] - accepted_y[asset["row"]],
        }
        if crop != expected_crop:
            fail(f"{label}.crop must exactly match its accepted gutter cell {expected_crop}")
        require_integer(asset["expected_components"], f"{label}.expected_components", 1, 9)
        canvas = require_object(asset["canvas"], f"{label}.canvas")
        require_exact_keys(canvas, {"width", "height", "padding"}, f"{label}.canvas")
        width = require_integer(canvas["width"], f"{label}.canvas.width", 1, 2048)
        height = require_integer(canvas["height"], f"{label}.canvas.height", 1, 2048)
        padding = require_integer(canvas["padding"], f"{label}.canvas.padding", 1, min(width, height) // 3)
        if width - 2 * padding <= 0 or height - 2 * padding <= 0:
            fail(f"{label}.canvas padding leaves no content area")
        require_integer(
            asset["maximum_soft_edge_expansion"],
            f"{label}.maximum_soft_edge_expansion",
            1,
            128,
        )
        output = Path(asset["output"])
        if output.parent != EXPECTED_OUTPUT_DIRECTORY or output.name != f"{expected_id}.webp":
            fail(f"{label}.output must be the canonical Chapter Three prop path")
        if asset["output"] in seen_outputs:
            fail(f"spec.assets repeats output {asset['output']}")
        seen_outputs.add(asset["output"])
        repo_path(asset["output"], f"{label}.output")


def chroma_helper_path(spec: dict[str, Any]) -> Path:
    codex_home = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
    helper = codex_home / spec["alpha"]["helper"]
    if not helper.is_file():
        fail(f"installed chroma helper is missing: {helper}")
    return helper


def command_version(command: str, arguments: list[str]) -> str:
    try:
        result = subprocess.run(
            [command, *arguments],
            check=True,
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError) as error:
        fail(f"cannot read {command} version: {error}")
    return (result.stdout or result.stderr).strip()


def alpha_bbox(alpha: Image.Image, threshold: int = 0) -> tuple[int, int, int, int] | None:
    if threshold == 0:
        return alpha.getbbox()
    return alpha.point(lambda value: 255 if value > threshold else 0).getbbox()


def global_bounds(
    local: tuple[int, int, int, int], crop: dict[str, int]
) -> list[int]:
    return [
        local[0] + crop["x"],
        local[1] + crop["y"],
        local[2] + crop["x"],
        local[3] + crop["y"],
    ]


def connected_components(
    alpha: Image.Image,
    crop: dict[str, int],
    threshold: int,
    minimum_pixels: int,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    width, height = alpha.size
    values = alpha.tobytes()
    active = bytearray(1 if value > threshold else 0 for value in values)
    seen = bytearray(width * height)
    retained: list[dict[str, Any]] = []
    ignored_components = 0
    ignored_pixels = 0
    largest_ignored = 0

    for start, visible in enumerate(active):
        if not visible or seen[start]:
            continue
        seen[start] = 1
        queue = deque([start])
        pixels = 0
        min_x = width
        min_y = height
        max_x = -1
        max_y = -1
        sum_x = 0
        sum_y = 0
        while queue:
            pixel = queue.pop()
            x = pixel % width
            y = pixel // width
            pixels += 1
            sum_x += x
            sum_y += y
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
            for neighbor_y in range(max(0, y - 1), min(height, y + 2)):
                for neighbor_x in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = neighbor_y * width + neighbor_x
                    if active[neighbor] and not seen[neighbor]:
                        seen[neighbor] = 1
                        queue.append(neighbor)

        if pixels < minimum_pixels:
            ignored_components += 1
            ignored_pixels += pixels
            largest_ignored = max(largest_ignored, pixels)
            continue
        local_bounds = [min_x, min_y, max_x + 1, max_y + 1]
        retained.append(
            {
                "pixels": pixels,
                "bounds": global_bounds(tuple(local_bounds), crop),
                "centroid": [
                    round(crop["x"] + sum_x / pixels, 3),
                    round(crop["y"] + sum_y / pixels, 3),
                ],
            }
        )

    retained.sort(key=lambda component: component["pixels"], reverse=True)
    return retained, {
        "components": ignored_components,
        "pixels": ignored_pixels,
        "largest_component_pixels": largest_ignored,
    }


def verify_empty_gutters(alpha: Image.Image, spec: dict[str, Any]) -> list[dict[str, Any]]:
    results = []
    for index, gutter in enumerate(spec["grid"]["verified_empty_gutters"]):
        label = f"spec.grid.verified_empty_gutters[{index}]"
        require_exact_keys(require_object(gutter, label), {"axis", "start", "end", "boundary"}, label)
        if gutter["axis"] not in {"x", "y"}:
            fail(f"{label}.axis must be x or y")
        limit = alpha.width if gutter["axis"] == "x" else alpha.height
        start = require_integer(gutter["start"], f"{label}.start", 0, limit - 1)
        end = require_integer(gutter["end"], f"{label}.end", start + 1, limit)
        boundary = require_integer(gutter["boundary"], f"{label}.boundary", start, end - 1)
        if gutter["axis"] == "x":
            band = alpha.crop((start, 0, end, alpha.height))
        else:
            band = alpha.crop((0, start, alpha.width, end))
        nonzero = sum(band.histogram()[1:])
        if nonzero:
            fail(
                f"accepted {gutter['axis']}-gutter [{start},{end}) contains "
                f"{nonzero} visible alpha pixels; a prop overlaps its neighbor"
            )
        results.append({**gutter, "visible_alpha_pixels": nonzero})
    return results


def component_overrun(
    bounds: list[int], asset: dict[str, Any], spec: dict[str, Any]
) -> dict[str, int]:
    x = spec["grid"]["equal_boundaries"]["x"]
    y = spec["grid"]["equal_boundaries"]["y"]
    left = x[asset["column"]]
    right = x[asset["column"] + 1]
    top = y[asset["row"]]
    bottom = y[asset["row"] + 1]
    return {
        "left": max(0, left - bounds[0]),
        "top": max(0, top - bounds[1]),
        "right": max(0, bounds[2] - right),
        "bottom": max(0, bounds[3] - bottom),
    }


def assert_component_centers_in_equal_cell(
    components: list[dict[str, Any]], asset: dict[str, Any], spec: dict[str, Any]
) -> None:
    x = spec["grid"]["equal_boundaries"]["x"]
    y = spec["grid"]["equal_boundaries"]["y"]
    left = x[asset["column"]]
    right = x[asset["column"] + 1]
    top = y[asset["row"]]
    bottom = y[asset["row"] + 1]
    for component in components:
        center_x, center_y = component["centroid"]
        if not (left <= center_x < right and top <= center_y < bottom):
            fail(
                f"{asset['id']} component centered at {component['centroid']} is outside "
                f"its requested equal-grid cell; refusing to remap it"
            )


def fit_trimmed_image(
    trimmed: Image.Image, canvas_spec: dict[str, int]
) -> tuple[Image.Image, dict[str, Any]]:
    width = canvas_spec["width"]
    height = canvas_spec["height"]
    padding = canvas_spec["padding"]
    available_width = width - 2 * padding
    available_height = height - 2 * padding
    scale = min(available_width / trimmed.width, available_height / trimmed.height)
    resized_width = max(1, min(available_width, round(trimmed.width * scale)))
    resized_height = max(1, min(available_height, round(trimmed.height * scale)))

    # Pillow's RGBa mode stores premultiplied color, preventing dark or cyan
    # fringe from being introduced while the soft matte is resampled.
    resized = trimmed.convert("RGBa").resize(
        (resized_width, resized_height), Image.Resampling.LANCZOS
    ).convert("RGBA")
    destination_x = (width - resized_width) // 2
    destination_y = (height - resized_height) // 2
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.alpha_composite(resized, (destination_x, destination_y))
    return canvas, {
        "filter": "Pillow LANCZOS in premultiplied RGBa",
        "scale": round(scale, 9),
        "resized_dimensions": [resized_width, resized_height],
        "destination": [destination_x, destination_y],
        "padding_minimum": padding,
        "aspect_preserved": True,
    }


def soft_edge_expansion(alpha: Image.Image) -> tuple[list[int], list[int], list[int]]:
    nonzero = alpha_bbox(alpha, 0)
    strong = alpha_bbox(alpha, 127)
    if nonzero is None or strong is None:
        fail("output has no nonzero and strong alpha bounds")
    expansion = [
        strong[0] - nonzero[0],
        strong[1] - nonzero[1],
        nonzero[2] - strong[2],
        nonzero[3] - strong[3],
    ]
    return list(nonzero), list(strong), expansion


def validate_output(
    path: Path, asset: dict[str, Any], expected_hash: str | None = None
) -> dict[str, Any]:
    output_bytes = path.read_bytes()
    if len(output_bytes) <= 1024:
        fail(f"{asset['id']} output is implausibly small: {len(output_bytes)} bytes")
    actual_hash = digest(output_bytes)
    if expected_hash is not None and actual_hash != expected_hash:
        fail(f"{asset['id']} output hash changed: {actual_hash}, expected {expected_hash}")
    with Image.open(path) as opened:
        image = opened.convert("RGBA")
    expected_size = (asset["canvas"]["width"], asset["canvas"]["height"])
    if image.size != expected_size:
        fail(f"{asset['id']} dimensions are {image.size}, expected {expected_size}")

    alpha = image.getchannel("A")
    histogram = alpha.histogram()
    transparent = histogram[0]
    partial = sum(histogram[1:255])
    opaque = histogram[255]
    if not transparent or not partial or not opaque:
        fail(
            f"{asset['id']} must contain transparent, partial, and opaque pixels; "
            f"counts are {transparent}, {partial}, {opaque}"
        )
    corner_size = 16
    corner_boxes = {
        "top_left": (0, 0, corner_size, corner_size),
        "top_right": (image.width - corner_size, 0, image.width, corner_size),
        "bottom_left": (0, image.height - corner_size, corner_size, image.height),
        "bottom_right": (
            image.width - corner_size,
            image.height - corner_size,
            image.width,
            image.height,
        ),
    }
    corner_extrema = {
        name: list(alpha.crop(box).getextrema()) for name, box in corner_boxes.items()
    }
    if any(extrema != [0, 0] for extrema in corner_extrema.values()):
        fail(f"{asset['id']} corners are not transparent: {corner_extrema}")

    nonzero_bounds, strong_bounds, expansion = soft_edge_expansion(alpha)
    maximum_expansion = max(expansion)
    if maximum_expansion > asset["maximum_soft_edge_expansion"]:
        fail(
            f"{asset['id']} soft alpha expands {maximum_expansion}px beyond strong art; "
            f"limit is {asset['maximum_soft_edge_expansion']}px"
        )
    insets = [
        nonzero_bounds[0],
        nonzero_bounds[1],
        image.width - nonzero_bounds[2],
        image.height - nonzero_bounds[3],
    ]
    if min(insets) < max(1, asset["canvas"]["padding"] - 2):
        fail(
            f"{asset['id']} alpha bounds {nonzero_bounds} violate its transparent "
            f"padding contract {asset['canvas']['padding']}"
        )

    visible_cyan_pixels = 0
    maximum_visible_cyan_excess = 0
    for red, green, blue, pixel_alpha in image.get_flattened_data():
        if pixel_alpha <= 12:
            continue
        cyan_excess = min(green, blue) - red
        maximum_visible_cyan_excess = max(maximum_visible_cyan_excess, cyan_excess)
        if min(green, blue) >= 180 and cyan_excess > 80:
            visible_cyan_pixels += 1
    if visible_cyan_pixels:
        fail(
            f"{asset['id']} retains {visible_cyan_pixels} visible cyan pixels; "
            f"maximum excess is {maximum_visible_cyan_excess}"
        )

    return {
        "path": asset["output"],
        "dimensions": list(image.size),
        "bytes": len(output_bytes),
        "sha256": actual_hash,
        "alpha": {
            "extrema": list(alpha.getextrema()),
            "transparent_pixels": transparent,
            "partially_transparent_pixels": partial,
            "opaque_pixels": opaque,
            "nonzero_bounds": nonzero_bounds,
            "strong_bounds_alpha_gt_127": strong_bounds,
            "soft_edge_expansion": expansion,
            "maximum_soft_edge_expansion": maximum_expansion,
            "corner_patch_size": [corner_size, corner_size],
            "corner_alpha_extrema": corner_extrema,
            "visible_cyan_alpha_floor": 12,
            "visible_cyan_channel_floor": 180,
            "visible_cyan_excess_threshold": 80,
            "visible_cyan_pixels_above_threshold": visible_cyan_pixels,
            "maximum_visible_cyan_excess": maximum_visible_cyan_excess,
        },
    }


def process(spec_path: Path) -> dict[str, Any]:
    spec, spec_bytes = read_spec(spec_path)
    processor_path = Path(__file__).resolve()
    processor_bytes = processor_path.read_bytes()
    source_path = repo_path(spec["source"]["path"], "spec.source.path")
    source_bytes = source_path.read_bytes()
    actual_source_hash = digest(source_bytes)
    if actual_source_hash != spec["source"]["sha256"]:
        fail(
            f"source SHA-256 is {actual_source_hash}; expected {spec['source']['sha256']}"
        )
    with Image.open(source_path) as source_opened:
        source_size = source_opened.size
        source_mode = source_opened.mode
    expected_source_size = (spec["source"]["width"], spec["source"]["height"])
    if source_size != expected_source_size:
        fail(f"source dimensions are {source_size}, expected {expected_source_size}")
    if source_mode not in {"RGB", "RGBA"}:
        fail(f"source mode must be RGB or RGBA, not {source_mode}")

    request_path = repo_path(spec["request"]["path"], "spec.request.path")
    request_bytes = request_path.read_bytes()
    try:
        request = json.loads(request_bytes)
    except json.JSONDecodeError as error:
        fail(f"request JSON cannot be read: {error}")
    if tuple(request.get("layout", {}).get("order", [])) != EXPECTED_IDS:
        fail("generation request order no longer matches the processing spec")

    helper = chroma_helper_path(spec)
    cwebp = shutil.which(spec["encoding"]["tool"])
    if cwebp is None:
        fail("cwebp is required to encode the shipping assets")

    with tempfile.TemporaryDirectory(prefix="violet-ch3-props-") as temp_name:
        temporary = Path(temp_name)
        alpha_sheet_path = temporary / "core-v1-alpha.png"
        helper_command = [
            sys.executable,
            str(helper),
            "--input",
            str(source_path),
            "--out",
            str(alpha_sheet_path),
            *spec["alpha"]["arguments"],
        ]
        try:
            helper_result = subprocess.run(
                helper_command,
                check=True,
                capture_output=True,
                text=True,
            )
        except subprocess.CalledProcessError as error:
            fail(f"installed chroma helper failed: {error.stderr or error.stdout}")
        key_match = re.search(r"^Key color: #(\w{6})$", helper_result.stdout, re.MULTILINE)
        if key_match is None:
            fail("installed chroma helper did not report its sampled key color")
        with Image.open(alpha_sheet_path) as alpha_opened:
            alpha_sheet = alpha_opened.convert("RGBA")
        if alpha_sheet.size != expected_source_size:
            fail("alpha sheet dimensions changed during chroma removal")
        sheet_alpha = alpha_sheet.getchannel("A")
        if sheet_alpha.getextrema() != (0, 255):
            fail(f"source alpha extrema are {sheet_alpha.getextrema()}, expected (0, 255)")
        gutter_evidence = verify_empty_gutters(sheet_alpha, spec)

        asset_records = []
        built_outputs: list[tuple[dict[str, Any], Path, dict[str, Any]]] = []
        total_retained_components = 0
        total_ignored_pixels = 0

        for asset in spec["assets"]:
            crop = asset["crop"]
            box = (
                crop["x"],
                crop["y"],
                crop["x"] + crop["width"],
                crop["y"] + crop["height"],
            )
            cell = alpha_sheet.crop(box)
            cell_alpha = cell.getchannel("A")
            bounds = alpha_bbox(cell_alpha, 0)
            if bounds is None:
                fail(f"{asset['id']} accepted crop contains no visible alpha")
            if bounds[0] == 0 or bounds[1] == 0 or bounds[2] == cell.width or bounds[3] == cell.height:
                fail(
                    f"{asset['id']} alpha bounds {bounds} touch its accepted crop edge; "
                    "the crop would cut art"
                )
            source_bounds = global_bounds(bounds, crop)
            components, ignored = connected_components(
                cell_alpha,
                crop,
                spec["alpha"]["component_alpha_floor"],
                spec["alpha"]["component_min_pixels"],
            )
            if len(components) != asset["expected_components"]:
                fail(
                    f"{asset['id']} contains {len(components)} retained components, "
                    f"expected {asset['expected_components']}"
                )
            if ignored["pixels"] > spec["alpha"]["maximum_ignored_component_pixels"]:
                fail(
                    f"{asset['id']} contains {ignored['pixels']} pixels in small disconnected "
                    "components; possible extra or malformed content"
                )
            assert_component_centers_in_equal_cell(components, asset, spec)
            total_retained_components += len(components)
            total_ignored_pixels += ignored["pixels"]

            trimmed = cell.crop(bounds)
            canvas, placement = fit_trimmed_image(trimmed, asset["canvas"])
            shipping_png = temporary / f"{asset['id']}.png"
            output_webp = temporary / f"{asset['id']}.webp"
            canvas.save(shipping_png, format="PNG", compress_level=9)
            cwebp_command = [
                cwebp,
                *spec["encoding"]["arguments"],
                str(shipping_png),
                "-o",
                str(output_webp),
            ]
            try:
                subprocess.run(cwebp_command, check=True, capture_output=True, text=True)
            except subprocess.CalledProcessError as error:
                fail(f"cwebp failed for {asset['id']}: {error.stderr or error.stdout}")
            output_record = validate_output(output_webp, asset)
            built_outputs.append((asset, output_webp, output_record))
            asset_records.append(
                {
                    "id": asset["id"],
                    "key": asset["key"],
                    "request_index": len(asset_records),
                    "grid_cell": {"row": asset["row"], "column": asset["column"]},
                    "crop": crop,
                    "source_alpha_bounds": source_bounds,
                    "trimmed_dimensions": [trimmed.width, trimmed.height],
                    "components": components,
                    "ignored_small_components": ignored,
                    "equal_cell_overrun": component_overrun(source_bounds, asset, spec),
                    "placement": placement,
                    "output": output_record,
                }
            )

        if total_retained_components != 12:
            fail(
                f"sheet has {total_retained_components} retained components; expected eight "
                "single-object props plus four separate wet footprints"
            )
        if total_ignored_pixels > spec["alpha"]["maximum_ignored_component_pixels"]:
            fail(f"sheet contains {total_ignored_pixels} ignored component pixels")

        output_directory = ROOT / EXPECTED_OUTPUT_DIRECTORY
        output_directory.mkdir(parents=True, exist_ok=True)
        for asset, temporary_output, _record in built_outputs:
            destination = repo_path(asset["output"], f"{asset['id']}.output")
            atomic = destination.with_name(f".{destination.name}.{os.getpid()}.tmp")
            shutil.copyfile(temporary_output, atomic)
            os.replace(atomic, destination)

        # Re-read the installed outputs after the atomic copy. The metadata's
        # hashes therefore describe the exact bytes the game will preload.
        for asset, _temporary_output, record in built_outputs:
            installed = repo_path(asset["output"], f"{asset['id']}.output")
            validate_output(installed, asset, expected_hash=record["sha256"])

        metadata = {
            "schema_version": 1,
            "id": spec["id"],
            "deterministic": True,
            "processing_spec": {
                "path": relative(spec_path),
                "bytes": len(spec_bytes),
                "sha256": digest(spec_bytes),
            },
            "processor": {
                "path": relative(processor_path),
                "bytes": len(processor_bytes),
                "sha256": digest(processor_bytes),
                "command": "python3 art/chapters/ch3/props/process-core-v1.py",
            },
            "request": {
                "path": relative(request_path),
                "bytes": len(request_bytes),
                "sha256": digest(request_bytes),
                "order": list(EXPECTED_IDS),
            },
            "source": {
                "path": relative(source_path),
                "dimensions": list(source_size),
                "mode": source_mode,
                "bytes": len(source_bytes),
                "sha256": actual_source_hash,
            },
            "alpha_extraction": {
                "tool": str(helper).replace(str(Path.home()), "${HOME}"),
                "arguments": spec["alpha"]["arguments"],
                "sampled_key_color": f"#{key_match.group(1).lower()}",
                "component_alpha_floor": spec["alpha"]["component_alpha_floor"],
                "component_min_pixels": spec["alpha"]["component_min_pixels"],
                "sheet_alpha_extrema": list(sheet_alpha.getextrema()),
                "sheet_alpha_bounds": list(sheet_alpha.getbbox()),
            },
            "grid": {
                "equal_boundaries": spec["grid"]["equal_boundaries"],
                "accepted_gutter_boundaries": spec["grid"]["accepted_gutter_boundaries"],
                "verified_empty_gutters": gutter_evidence,
                "selection_rule": (
                    "Fixed boundaries are centered in source-wide zero-alpha gutters. "
                    "Every retained component centroid remains in its requested equal-grid cell."
                ),
                "retained_component_count": total_retained_components,
                "ignored_small_component_pixels": total_ignored_pixels,
            },
            "resampling": {
                "algorithm": "Pillow LANCZOS in premultiplied RGBa",
                "preserves_aspect": True,
                "pillow_version": PIL.__version__,
            },
            "encoding": {
                "tool": cwebp,
                "version": command_version(cwebp, ["-version"]),
                "arguments": spec["encoding"]["arguments"],
            },
            "assets": asset_records,
        }
        metadata_path = repo_path(spec["metadata"]["path"], "spec.metadata.path")
        metadata_path.parent.mkdir(parents=True, exist_ok=True)
        metadata_bytes = canonical_json(metadata)
        atomic_metadata = metadata_path.with_name(f".{metadata_path.name}.{os.getpid()}.tmp")
        atomic_metadata.write_bytes(metadata_bytes)
        os.replace(atomic_metadata, metadata_path)
        return metadata


def check(spec_path: Path) -> dict[str, Any]:
    spec, _spec_bytes = read_spec(spec_path)
    metadata_path = repo_path(spec["metadata"]["path"], "spec.metadata.path")
    try:
        metadata = json.loads(metadata_path.read_bytes())
    except (OSError, json.JSONDecodeError) as error:
        fail(f"cannot read processing metadata {metadata_path}: {error}")
    if metadata.get("id") != spec["id"] or metadata.get("schema_version") != 1:
        fail("processing metadata identity does not match the spec")
    if metadata.get("processing_spec", {}).get("sha256") != digest(spec_path.read_bytes()):
        fail("processing metadata does not describe the current spec")
    if metadata.get("processor", {}).get("sha256") != digest(Path(__file__).read_bytes()):
        fail("processing metadata does not describe the current processor")
    records = metadata.get("assets")
    if not isinstance(records, list) or [record.get("id") for record in records] != list(EXPECTED_IDS):
        fail("processing metadata does not retain the exact nine-asset request order")
    for asset, record in zip(spec["assets"], records, strict=True):
        if record.get("crop") != asset["crop"]:
            fail(f"metadata crop for {asset['id']} differs from the processing spec")
        output = repo_path(asset["output"], f"{asset['id']}.output")
        validate_output(output, asset, expected_hash=record.get("output", {}).get("sha256"))
    return metadata


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--spec", type=Path, default=DEFAULT_SPEC)
    parser.add_argument(
        "--check",
        action="store_true",
        help="validate the current metadata and shipping bytes without rebuilding them",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    spec_path = args.spec.resolve()
    try:
        metadata = check(spec_path) if args.check else process(spec_path)
    except (OSError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1) from error
    action = "Validated" if args.check else "Built"
    print(
        f"{action} {len(metadata['assets'])} Chapter Three prop assets from "
        f"{metadata['source']['sha256']}."
    )


if __name__ == "__main__":
    main()
