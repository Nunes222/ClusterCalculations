#!/usr/bin/env python3
"""
BESS discharge/charge schedule -> Power Automate webhook reminders.

Reads a 15-min interval table (start, end, charge_kw, discharge_kw) and
automatically fires a webhook message every time the discharge (or charge)
column transitions between 0 and a non-zero value ("starts" / "stops").

Table format (tab-separated, decimal comma or dot both accepted):
    start   end     charge_kw   discharge_kw
    23:00   23:15   0           0
    06:00   06:15   0           0,3
    ...

Usage:
    python bess_webhook_scheduler.py bess_schedule.csv
    python bess_webhook_scheduler.py bess_schedule.csv --dry-run
    python bess_webhook_scheduler.py bess_schedule.csv --no-charge-events
"""

import re
import sys
import csv
import time
import argparse
import requests
from datetime import datetime, timedelta

# --- Configuration -------------------------------------------------------

WEBHOOK_URL = (
    "https://defaultb9418667dc3e4da98081b0750534a3.47.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/26/workflows/547fe586409044e6bb81ade486e0b6e7/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DFvELVnLdExlXX_7G7rEED4m29e-sMo8UFt2TEhQK2w"
)


# --- Card / send -----------------------------------------------------------

def build_adaptive_card(message: str) -> dict:
    return {
        "type": "AdaptiveCard",
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.4",
        "body": [{"type": "TextBlock", "text": message, "wrap": True}],
    }


def send_message(message: str) -> requests.Response:
    payload = build_adaptive_card(message)
    headers = {"Content-Type": "application/json"}
    return requests.post(WEBHOOK_URL, headers=headers, json=payload)


# --- Parsing ---------------------------------------------------------------

def parse_number(raw: str) -> float:
    raw = raw.strip().replace(",", ".")
    return float(raw) if raw else 0.0


def parse_schedule(path: str):
    """Parse the tab/CSV schedule file into a list of row dicts."""
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        sample = f.read(2048)
        f.seek(0)
        delimiter = "\t" if "\t" in sample else ("," if sample.count(",") > sample.count(";") else ";")
        reader = csv.reader(f, delimiter=delimiter)
        header_skipped = False
        for parts in reader:
            parts = [p for p in parts if p != ""]
            if not parts:
                continue
            if not header_skipped and not re.match(r"^\d{1,2}:\d{2}$", parts[0].strip()):
                header_skipped = True
                continue
            if len(parts) < 4:
                continue
            start, end, charge_raw, discharge_raw = parts[0], parts[1], parts[2], parts[3]
            rows.append(
                {
                    "start": start.strip(),
                    "end": end.strip(),
                    "charge_kw": parse_number(charge_raw),
                    "discharge_kw": parse_number(discharge_raw),
                }
            )
    return rows


def anchor_datetimes(rows, from_dt: datetime):
    """
    Assign an absolute datetime to each row's start time, beginning at the
    first future occurrence of rows[0]'s time (today or tomorrow), and
    rolling the date forward by one day every time the time-of-day wraps
    (goes backwards, e.g. 23:45 -> 00:00).
    """
    if not rows:
        return []

    first_t = datetime.strptime(rows[0]["start"], "%H:%M").time()
    anchor_date = from_dt.date()
    first_dt = datetime.combine(anchor_date, first_t)
    if first_dt <= from_dt:
        anchor_date += timedelta(days=1)

    out = []
    current_date = anchor_date
    prev_t = None
    for row in rows:
        t = datetime.strptime(row["start"], "%H:%M").time()
        if prev_t is not None and t < prev_t:
            current_date += timedelta(days=1)
        dt = datetime.combine(current_date, t)
        out.append({**row, "start_dt": dt})
        prev_t = t
    return out


def build_events(rows_with_dt, include_charge=True, include_discharge=True):
    """
    Walk the rows in order and emit an event whenever discharge_kw or
    charge_kw crosses the zero <-> non-zero boundary.
    """
    events = []
    prev_discharge = 0.0
    prev_charge = 0.0

    for row in rows_with_dt:
        dt = row["start_dt"]
        d = row["discharge_kw"]
        c = row["charge_kw"]

        if include_discharge:
            if prev_discharge == 0.0 and d != 0.0:
                events.append((dt, f"🔋⚡ BESS DISCHARGE STARTED at {row['start']} — {d:g} kW"))
            elif prev_discharge != 0.0 and d == 0.0:
                events.append((dt, f"🔋⏹️ BESS DISCHARGE STOPPED at {row['start']}"))

        if include_charge:
            if prev_charge == 0.0 and c != 0.0:
                events.append((dt, f"🔌⚡ BESS CHARGE STARTED at {row['start']} — {c:g} kW"))
            elif prev_charge != 0.0 and c == 0.0:
                events.append((dt, f"🔌⏹️ BESS CHARGE STOPPED at {row['start']}"))

        prev_discharge = d
        prev_charge = c

    events.sort(key=lambda e: e[0])
    return events


# --- Main --------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Schedule BESS charge/discharge webhook reminders.")
    parser.add_argument("schedule_file", help="Path to the schedule CSV/TSV file")
    parser.add_argument("--dry-run", action="store_true", help="Print the computed events, don't wait or send")
    parser.add_argument("--no-charge-events", action="store_true", help="Only fire on discharge start/stop")
    parser.add_argument("--no-discharge-events", action="store_true", help="Only fire on charge start/stop")
    args = parser.parse_args()

    rows = parse_schedule(args.schedule_file)
    if not rows:
        print("No rows parsed from schedule file. Check the format.")
        sys.exit(1)

    now = datetime.now()
    rows_dt = anchor_datetimes(rows, now)
    events = build_events(
        rows_dt,
        include_charge=not args.no_charge_events,
        include_discharge=not args.no_discharge_events,
    )

    # Only future events matter for actually sending
    future_events = [e for e in events if e[0] > now]

    print(f"Now: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Parsed {len(rows)} schedule rows -> {len(events)} transition events, "
          f"{len(future_events)} still upcoming:\n")
    for dt, msg in events:
        marker = " (upcoming)" if dt > now else ""
        print(f"  {dt.strftime('%Y-%m-%d %H:%M')}  {msg}{marker}")

    if args.dry_run:
        print("\nDry run only — no messages sent.")
        return

    if not future_events:
        print("\nNo upcoming events to schedule (all times are in the past for this cycle).")
        return

    print("\nStarting scheduler loop. Leave this running until all events fire.\n")
    for dt, msg in future_events:
        now = datetime.now()
        wait_seconds = (dt - now).total_seconds()
        if wait_seconds > 0:
            print(f"Waiting {wait_seconds/60:.1f} min until {dt.strftime('%H:%M:%S')} -> {msg}")
            time.sleep(wait_seconds)

        print(f"[{datetime.now().strftime('%H:%M:%S')}] Sending: {msg}")
        try:
            resp = send_message(msg)
            status = "OK" if resp.ok else f"FAILED ({resp.status_code})"
            print(f"  -> {status}")
        except Exception as exc:
            print(f"  -> ERROR sending webhook: {exc}")

    print("\nAll scheduled events for this cycle have been sent.")


if __name__ == "__main__":
    main()