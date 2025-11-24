"use client";
import React, { useState } from "react";
import { submitJob, getStatus } from "../lib/api";

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
      const data = await submitJob(fd);
      setJobId(data.job_id);
      setStatus("queued");
      pollStatus(data.job_id);
    } catch (e) {
      console.error(e);
      setStatus("error submitting job");
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
          } else {
            // Job finished but result indicates error
            const errorMsg =
              s.result && s.result.error ? s.result.error : "unknown error";
            setStatus("failed: " + errorMsg);
            console.error("job completed with error", s.result);
          }
        } else if (s.status === "failed" || s.status === "error") {
          // RQ reported failure
          const errorMsg =
            s.result && typeof s.result === "object" && s.result.error
              ? s.result.error
              : typeof s.result === "string"
              ? s.result
              : "unknown error";
          setStatus("failed: " + errorMsg);
          console.error("job failed", s.result);
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

  return (
    <div className="max-w-3xl mx-auto p-5 font-sans text-black">
      <h2 className="text-2xl font-bold text-center mb-6">
        AI Floorplan Generator
      </h2>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 bg-gray-100 p-6 rounded-lg shadow-sm text-black"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-bold text-gray-800">
              Square Footage
            </label>
            <input
              type="number"
              value={sqft}
              onChange={(e) => setSqft(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-bold text-gray-800">
              Garages
            </label>
            <input
              type="number"
              value={garages}
              onChange={(e) => setGarages(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-bold text-gray-800">
              Bedrooms
            </label>
            <input
              type="number"
              value={bedrooms}
              onChange={(e) => setBedrooms(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-bold text-gray-800">
              Bathrooms
            </label>
            <input
              type="number"
              value={bathrooms}
              onChange={(e) => setBathrooms(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-bold text-gray-800">
            Additional Details (Optional)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. open concept kitchen, large windows"
            className="w-full p-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors"
        >
          Generate Floorplan
        </button>
      </form>

      {status && (
        <div className="mt-5 p-3 bg-blue-50 text-blue-900 rounded border border-blue-100">
          <strong>Status:</strong> {status}
        </div>
      )}

      {resultUrl && (
        <div className="mt-8 text-center">
          <img
            src={resultUrl}
            alt="result"
            className="max-w-full rounded-lg shadow-lg mx-auto"
          />
          <div className="mt-4">
            <a
              href={resultUrl}
              download={`floorplan-${resultJobId}.png`}
              className="inline-block py-2 px-6 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition-colors no-underline"
            >
              Download Image
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
