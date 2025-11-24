"use client";
import type React from "react";
import { useState } from "react";
import { submitJob, getStatus } from "../lib/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import {
  Minus,
  Plus,
  Download,
  RotateCcw,
  Grid3x3,
  Loader2,
} from "lucide-react";

export default function Generator() {
  const [prompt, setPrompt] = useState("");
  const [sqft, setSqft] = useState(2000);
  const [garages, setGarages] = useState(2);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultJobId, setResultJobId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("sqft", sqft.toString());
    fd.append("garages", garages.toString());
    fd.append("bedrooms", bedrooms.toString());
    fd.append("bathrooms", bathrooms.toString());
    if (prompt) fd.append("prompt", prompt);
    if (file) fd.append("control_image", file);

    try {
      setLoadingProgress(0);
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const data = await submitJob(fd);
      setJobId(data.job_id);
      setStatus("queued");

      setTimeout(() => {
        clearInterval(progressInterval);
        setLoadingProgress(100);
      }, 2000);

      pollStatus(data.job_id);
    } catch (e) {
      console.error(e);
      setStatus("error submitting job");
      setLoadingProgress(0);
    }
  }

  async function pollStatus(id: string) {
    setTimeout(async () => {
      try {
        const s = await getStatus(id);
        setStatus(s.status);
        if (
          s.status === "finished" ||
          s.status === "success" ||
          s.status === "complete"
        ) {
          if (s.result && s.result.status === "success") {
            console.log(s.result.job_id);
            setResultUrl(
              (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") +
                "/generated/" +
                s.result.job_id +
                ".png"
            );
            setResultJobId(s.result.job_id);
            setLoadingProgress(0);
          } else {
            const errorMsg =
              s.result && s.result.error ? s.result.error : "unknown error";
            setStatus("failed: " + errorMsg);
            console.error("job completed with error", s.result);
            setLoadingProgress(0);
          }
        } else if (s.status === "failed" || s.status === "error") {
          const errorMsg =
            s.result && typeof s.result === "object" && s.result.error
              ? s.result.error
              : typeof s.result === "string"
              ? s.result
              : "unknown error";
          setStatus("failed: " + errorMsg);
          console.error("job failed", s.result);
          setLoadingProgress(0);
        } else {
          pollStatus(id);
        }
      } catch (e) {
        console.error("polling error", e);
        setStatus("error polling status: " + String(e));
        pollStatus(id);
      }
    }, 2000);
  }

  const Counter = ({
    value,
    onChange,
    min = 0,
    max = 10,
    label,
  }: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="h-9 w-9 rounded-sm border-zinc-300"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <div className="text-2xl font-light text-zinc-900">{value}</div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="h-9 w-9 rounded-sm border-zinc-300"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const isLoading =
    !!status &&
    !resultUrl &&
    !status.includes("failed") &&
    !status.includes("error");

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="text-2xl font-light tracking-tight text-zinc-900">
            AI Floorplan Generator
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Panel - Control Center */}
          <div>
            <Card className="border-zinc-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-lg font-medium text-zinc-900">
                Control Center
              </h2>

              <form onSubmit={onSubmit} className="space-y-6">
                {/* Square Footage Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-700">
                      Square Footage
                    </label>
                    <span className="text-sm font-light text-zinc-500">
                      {sqft.toLocaleString()} sqft
                    </span>
                  </div>
                  <Slider
                    value={[sqft]}
                    onValueChange={(value: React.SetStateAction<number>[]) =>
                      setSqft(value[0])
                    }
                    min={500}
                    max={10000}
                    step={100}
                    className="w-full"
                  />
                </div>

                {/* Counters Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Counter
                    label="Bedrooms"
                    value={bedrooms}
                    onChange={setBedrooms}
                    min={1}
                    max={10}
                  />
                  <Counter
                    label="Bathrooms"
                    value={bathrooms}
                    onChange={setBathrooms}
                    min={1}
                    max={10}
                  />
                </div>

                <Counter
                  label="Garages"
                  value={garages}
                  onChange={setGarages}
                  min={0}
                  max={5}
                />

                {/* Additional Details */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">
                    Additional Details
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e: {
                      target: { value: React.SetStateAction<string> };
                    }) => setPrompt(e.target.value)}
                    placeholder="e.g., open concept, south facing, large windows..."
                    className="min-h-[100px] resize-none border-zinc-300 text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  type="submit"
                  className="w-full rounded-sm bg-zinc-900 py-6 text-sm font-medium tracking-wide hover:bg-zinc-800"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Generate Floorplan"
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Panel - Visualization */}
          <div>
            <Card className="border-zinc-200 bg-white shadow-sm">
              {/* Default State */}
              {!status && !resultUrl && (
                <div className="flex min-h-[600px] flex-col items-center justify-center p-12 text-center">
                  <div className="mb-6 rounded-full bg-zinc-100 p-6">
                    <Grid3x3 className="h-12 w-12 text-zinc-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-zinc-900">
                    Enter parameters to generate your blueprint
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Configure your requirements and click generate
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex min-h-[600px] flex-col items-center justify-center p-12">
                  <div className="w-full max-w-md space-y-6">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 rounded-full bg-zinc-100 p-6">
                        <Loader2 className="h-12 w-12 animate-spin text-zinc-600" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium text-zinc-900">
                        Architectural Model Processing...
                      </h3>
                      <p className="text-sm text-zinc-500">
                        Analyzing specifications and generating layout
                      </p>
                    </div>
                    {loadingProgress > 0 && (
                      <div className="space-y-2">
                        <Progress value={loadingProgress} className="h-1" />
                        <p className="text-center text-xs text-zinc-400">
                          {loadingProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error State */}
              {status &&
                (status.includes("failed") || status.includes("error")) && (
                  <div className="flex min-h-[600px] flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 rounded-full bg-red-50 p-6">
                      <div className="h-12 w-12 text-red-500">⚠</div>
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-zinc-900">
                      Generation Failed
                    </h3>
                    <p className="text-sm text-zinc-500">{status}</p>
                  </div>
                )}

              {/* Result State */}
              {resultUrl && (
                <div className="p-6">
                  <div className="mb-4 overflow-hidden rounded-sm border border-zinc-200">
                    <img
                      src={resultUrl || "/placeholder.svg"}
                      alt="Generated Floorplan"
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      asChild
                      className="flex-1 rounded-sm bg-zinc-900 hover:bg-zinc-800"
                    >
                      <a
                        href={resultUrl}
                        download={`floorplan-${resultJobId}.png`}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResultUrl(null);
                        setStatus(null);
                        setJobId(null);
                        setResultJobId(null);
                      }}
                      className="flex-1 rounded-sm border-zinc-300"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
