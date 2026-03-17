/**
 * weatherService.test.ts
 *
 * Tests for the Open-Meteo weather integration and greeting hook builder.
 * Uses vi.stubGlobal to mock fetch so no real network calls are made.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWeatherGreetingHook, fetchCurrentWeather, resetWeatherCache } from "./weatherService";

// ─── Mock fetch ───────────────────────────────────────────────────────────────
const mockWeatherResponse = (weatherCode: number, tempF: number, feelsLikeF: number) => ({
  latitude: 30.0977,
  longitude: -95.6161,
  generationtime_ms: 0.1,
  utc_offset_seconds: -18000,
  timezone: "America/Chicago",
  timezone_abbreviation: "GMT-5",
  elevation: 59.0,
  current_units: {
    time: "iso8601",
    interval: "seconds",
    temperature_2m: "°F",
    apparent_temperature: "°F",
    weather_code: "wmo code",
    wind_speed_10m: "mp/h",
    precipitation: "inch",
    cloud_cover: "%",
  },
  current: {
    time: "2026-03-10T09:00",
    interval: 900,
    temperature_2m: tempF,
    apparent_temperature: feelsLikeF,
    weather_code: weatherCode,
    wind_speed_10m: 9.2,
    precipitation: 0.0,
    cloud_cover: 50,
  },
});

function mockFetch(data: object) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  }));
}

beforeEach(() => {
  vi.restoreAllMocks();
  // Reset the in-memory weather cache so each test fetches fresh data
  resetWeatherCache();
});

describe("weatherService - greeting hook", () => {
  it("returns a greeting with temperature on a sunny day", async () => {
    mockFetch(mockWeatherResponse(0, 75, 78));
    const hook = await getWeatherGreetingHook();
    expect(hook).toContain("75°F");
    expect(hook).toContain("clear skies");
  });

  it("mentions hot Texas day when temp is above 85°F", async () => {
    mockFetch(mockWeatherResponse(1, 92, 98));
    const hook = await getWeatherGreetingHook();
    expect(hook).toContain("92°F");
    expect(hook.toLowerCase()).toMatch(/hot|ac|indoors/);
  });

  it("uses indoor training pitch on rainy day", async () => {
    mockFetch(mockWeatherResponse(63, 68, 65));
    const hook = await getWeatherGreetingHook();
    expect(hook).toContain("68°F");
    expect(hook.toLowerCase()).toMatch(/rain|inside|indoor/);
  });

  it("uses thunderstorm pitch on storm day", async () => {
    mockFetch(mockWeatherResponse(95, 72, 70));
    const hook = await getWeatherGreetingHook();
    expect(hook.toLowerCase()).toMatch(/storm|inside|indoor/);
  });

  it("falls back gracefully when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const hook = await getWeatherGreetingHook();
    // Should return a non-empty fallback string
    expect(hook).toBeTruthy();
    expect(hook.length).toBeGreaterThan(10);
  });

  it("falls back gracefully when fetch returns non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    }));
    const hook = await getWeatherGreetingHook();
    expect(hook).toBeTruthy();
    expect(hook.length).toBeGreaterThan(10);
  });

  it("greeting includes a time-of-day salutation", async () => {
    mockFetch(mockWeatherResponse(2, 70, 72));
    const hook = await getWeatherGreetingHook();
    expect(hook).toMatch(/Good morning|Good afternoon|Good evening|Hey there/);
  });
});
