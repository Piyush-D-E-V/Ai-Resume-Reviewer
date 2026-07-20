import { useEffect, useState } from "react";

import constants, {
  buildPresenceChecklist,
  METRIC_CONFIG,
} from "../constants.js";

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";

// ✅ Correct
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const App = () => {
  const [aiReady, setAiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [presenceChecklist, setPresenceChecklist] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.puter?.ai?.chat) {
        setAiReady(true);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const extractPDFText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Fixed: Properly mapped over the pages using async/await inside Promise.all
    const texts = await Promise.all(
      Array.from({ length: pdf.numPages }, async (_, i) => {
        const page = await pdf.getPage(i + 1);
        const tc = await page.getTextContent();
        return tc.items.map((i) => i.str).join(" ");
      }),
    );
    return texts.join("\n").trim();
  };

  const parseJSONResponse = (reply) => {
    try {
      const match = reply.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : {};
      if (!parsed.overallScore && !parsed.error) {
        throw new Error("Invalid AI response");
      }
      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  };

  const analyzeResume = async (text) => {
    const prompt = constants.ANALYZE_RESUME_PROMPT.replace(
      "{{DOCUMENT_TEXT}}",
      text,
    );
    const response = await window.puter.ai.chat(
      [
        { role: "system", content: "You are an expert resume reviewer..." },
        { role: "user", content: prompt },
      ],
      {
        // Changed to a lighter model to save API limits during development
        model: "gpt-4o-mini",
      },
    );
    const result = parseJSONResponse(
      typeof response === "string" ? response : response.message?.content || "",
    );
    if (result.error) throw new Error(result.error);
    return result;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      throw new Error(`Please upload a PDF file only.`);
    }

    setUploadedFile(file);
    setIsLoading(true);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist([]);

    try {
      const text = await extractPDFText(file);
      setResumeText(text);
      setPresenceChecklist(buildPresenceChecklist(text));
      setAnalysis(await analyzeResume(text));
    } catch (error) {
      alert(`Error: ${error.message}`);
      reset();
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setUploadedFile(null);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist([]);
  };

  return (
    // Main Background: Deep black with text-white
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden font-sans pb-20 selection:bg-[#E55B3C] selection:text-white">
      
      {/* 1. THE SIGNATURE SHERYIANS GLOW */}
      {/* Yeh code center mein wo exact red/orange blur glow create karta hai */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#E55B3C] opacity-[0.12] blur-[120px] pointer-events-none rounded-full"></div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 flex flex-col items-center mt-8 sm:mt-16">

        {/* --- STATE 1: UPLOAD AREA (THE HERO SECTION) --- */}
        {!uploadedFile && !isLoading && (
          <div className="text-center w-full flex flex-col justify-center items-center animate-in fade-in duration-700 overflow-hidden mt-20">
            {/* Subheading */}
            <h3 className="text-[#E55B3C] tracking-[0.2em] uppercase text-xs sm:text-sm font-medium mb-6">
              Learn. Build. Get Placed.
            </h3>

            {/* Main Heading with Exact Highlight Box */}
            <h1 className="text-[2.5rem] sm:text-6xl md:text-[5rem] font-medium leading-[1.1] tracking-tight mb-8">
               AI Resume Analyzer <br className="hidden sm:block" />
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-base md:text-xl max-w-3xl mx-auto mb-10 font-light leading-relaxed">
                 Upload your PDF resume and get instant AI feedback
            </p>

            

            {/* Upload Input & Sheryians CTA Button */}
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={!aiReady}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={` border border-orange-500 bg-linear-to-r from-orange-500/10 to-orange-500 hover:opacity-90 text-white px-10 py-3.5 rounded-full font-medium text-lg transition-all cursor-pointer shadow-[0_0_20px_rgba(229,91,60,0.2)] flex items-center gap-2 ${
                !aiReady ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
              }`}
            >
              {aiReady ? "Upload →" : "Initializing AI Engine..."}
            </label>
          </div>
        )}

        {/* --- STATE 2: LOADING SPINNER --- */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-16 h-16 border-4 border-white/5 border-t-[#E55B3C] rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-medium mb-2 text-white">Analyzing Your Resume</h2>
            <p className="text-gray-400">AI is matching against industry standards...</p>
          </div>
        )}

        {/* --- STATE 3: RESULTS DASHBOARD --- */}
        {analysis && uploadedFile && !isLoading && (
          <div className="w-full animate-in slide-in-from-bottom-10 fade-in duration-700 flex flex-col gap-6">
            
            {/* Header / Restart Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-6 border-b border-white/10">
              <div>
                <h2 className="text-3xl font-medium mb-2">Resume Analyzed</h2>
                <p className="text-gray-400 flex items-center gap-2 text-sm">
                  <span className="text-[#E55B3C]">📄</span> {uploadedFile.name}
                </p>
              </div>
              <button onClick={reset} className="cursor-pointer mt-4 sm:mt-0 text-sm font-medium text-gray-300 hover:text-white px-6 py-2 border border-white/10 hover:border-white/30 hover:bg-linear-to-r to-orange-500/70 rounded-full transition-all">
                Upload New Resume
              </button>
            </div>

            {/* ROW 1: Score | Strengths | Improvements (Grid setup fixes the scaling issue) */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Score Box */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-center items-center text-center">
                 <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">Overall Score</h3>
                 <div className="text-[6rem] leading-none font-medium tracking-tighter text-white">
                    {analysis.overallScore}<span className="text-2xl text-[#E55B3C]"></span>
                 </div>
                 <div className="mt-6 w-full bg-white/5 rounded-full h-1 overflow-hidden">
                   <div className="bg-[#E55B3C] h-full rounded-full transition-all duration-1000" style={{ width: `${(parseInt(analysis.overallScore) / 10) * 100}%` }}></div>
                 </div>
              </div>

              {/* Strengths Box */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8">
                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-6">Top Strengths</h3>
                <ul className="space-y-4">
                  {analysis.strengths?.slice(0, 4).map((item, i) => (
                    <li key={i} className="text-gray-300 text-sm flex gap-3 leading-relaxed">
                      <span className="text-green-500 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements Box */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8">
                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-6">Needs Improvement</h3>
                <ul className="space-y-4">
                  {analysis.improvements?.slice(0, 4).map((item, i) => (
                    <li key={i} className="text-gray-300 text-sm flex gap-3 leading-relaxed">
                      <span className="text-[#E55B3C] shrink-0">↗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ROW 2: Executive Summary (Now Full Width & Fixed) */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8">
               <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">Executive Summary</h3>
               <p className="text-gray-300 leading-relaxed text-sm bg-white/5 p-4 rounded-xl border border-white/5">
                 {analysis.summary}
               </p>
            </div>

            {/* ROW 3: Performance Metrics (Now Colorful!) */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8">
               <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-6">Performance Metrics</h3>
               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 {METRIC_CONFIG.map((cfg, i) => {
                    const value = analysis.performanceMetrics?.[cfg.key] ?? cfg.defaultValue;
                    
                    // Fallback colors if cfg.colorClass is missing, providing a gradient look
                    const barColor = cfg.colorClass || 
                      (i % 3 === 0 ? "from-green-400 to-emerald-500" : 
                       i % 3 === 1 ? "from-blue-400 to-cyan-500" : 
                       "from-purple-400 to-fuchsia-500");

                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-300 flex items-center gap-2">
                            <span>{cfg.icon}</span> {cfg.label}
                          </span>
                          <span className="text-white font-medium">{value}/10</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          {/* Here we apply the gradient color class */}
                          <div className={`h-full rounded-full bg-linear-to-r ${barColor} transition-all duration-1000`} style={{ width: `${(value / 10) * 100}%` }}></div>
                        </div>
                      </div>
                    )
                 })}
               </div>
            </div>

            {/* ROW 4: Resume Insights (Action Items & Pro Tips) */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8">
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-6">Resume Insights</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Action Items */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-cyan-400">🎯</span>
                    <h4 className="text-white font-medium">Action Items</h4>
                  </div>
                  <div className="space-y-3">
                    {(analysis.actionItems || ["Optimize keyword placement for better ATS scoring", "Enhance content with quantifiable achievements", "Consider industry-Specific terminology"]).map((item, index) => (
                      <div key={index} className="flex gap-3 text-sm text-gray-400 leading-relaxed">
                        <span className="text-cyan-500 shrink-0">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Tips */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-emerald-400">💡</span>
                    <h4 className="text-white font-medium">Pro Tips</h4>
                  </div>
                  <div className="space-y-3">
                    {(analysis.proTips || ["Use action verbs to start bullet points", "Keep descriptions concise and impactful", "Tailor keywords to specific job descriptions"]).map((tip, index) => (
                      <div key={index} className="flex gap-3 text-sm text-gray-400 leading-relaxed">
                        <span className="text-emerald-500 shrink-0">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 5: ATS Optimization */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8">
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-6">ATS Optimization</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <span className="text-violet-400">🤖</span> What is ATS?
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    <strong className="text-white">Application Tracking Systems (ATS)</strong> are software tools used by 75%+ of employers to automatically screen resumes before human review. These systems scan for keywords, proper formatting, and relevant qualifications to rank candidates. If your resume isn't ATS-friendly, it may never reach a human recruiter.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    <span className="text-violet-400">📋</span> ATS Compatibility Checklist
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(presenceChecklist || []).map((item, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className={item.present ? "text-emerald-400" : "text-red-400"}>
                          {item.present ? "✅" : "❌"}
                        </span>
                        <span>{item.label || item.name || "Checklist item"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 6: Recommended Keywords */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8">
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-6">Recommended Keywords</h3>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {analysis.keywords?.map((k, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-sm text-gray-300 hover:bg-white/10 transition-colors">
                    {k}
                  </span>
                ))}
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-start gap-3">
                <span className="text-blue-400 mt-0.5">💡</span>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Consider incorporating these keywords naturally into your resume to improve ATS chances of getting noticed by recruiters.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default App;