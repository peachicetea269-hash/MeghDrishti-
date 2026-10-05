# Verification Data Contract

This document outlines the strict data structures and workflows required for historical verification of the MeghDrishti AI forecast-bust model.

## 1. Actual-Data Source
The source of ground truth for verification is the **Open-Meteo Historical Archive API** (`https://archive-api.open-meteo.com/v1/archive`). It provides ERA5 reanalysis data. Because historical actuals lag by about 3-5 days, only forecasts where the `forecast_timestamp` is at least several days in the past can be effectively verified.

## 2. Timestamps and Lead Time
A verification record natively aligns a past *forecast* against a past *actual observation*.
- `forecast_timestamp`: The target time the weather was predicted for (e.g. Oct 7th 12:00).
- `generated_at`: The time MeghDrishti generated the prediction (e.g. Oct 4th 12:00).
- `lead_time_hours`: Calculated as `forecast_timestamp - generated_at`. This allows measuring the reliability of the model at Day 1 vs Day 10 lead times.

**All matching is exact and timezone normalized.** The script normalizes both the stored forecast timestamps and the Open-Meteo API outputs (using `Asia/Kolkata`) before performing a strict string hash-join. Future records are strictly excluded during processing.

## 3. Duplicate Handling
To prevent duplicate records from inflating the reliability metrics, `historical_data.json` acts as an append/merge target. Before processing new eligible forecasts from `forecast_snapshots.jsonl`, the alignment script builds a hash map of existing alignments using the deterministic key:
`Location + Normalized Forecast Timestamp + Model Version`
If an alignment already exists, it is reused, preventing identical historical verification records from compounding.

## 4. Behavior when no historical pairs exist
At the beginning of the deployment lifecycle (or if the system is spun up in a test environment), there will naturally be zero eligible historical forecasts (because all stored forecasts target tomorrow or next week). 
When this occurs:
1. The alignment script explicitly logs: `"No valid historical forecast-vs-actual pairs are currently available."`
2. `historical_data.json` is left unmodified.
3. The `/api/reliability` endpoint will organically report `"status": "insufficient_data"`.

**Under no circumstances will synthetic or fabricated actual weather observations be injected to artificially populate reliability data.** Scientific integrity remains the highest priority.
