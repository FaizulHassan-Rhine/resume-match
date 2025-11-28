"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AnalysisModal from "@/components/AnalysisModal";
import { Upload, FileText, Search, BarChart3, Brain, Zap, Target, CheckCircle, TrendingUp, Award, Shield, Home as HomeIcon, Mail, Github, Linkedin } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");
  const [pdfjsLib, setPdfjsLib] = useState(null);
  const [pdfjsLoading, setPdfjsLoading] = useState(false); // Start as false, load silently
  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  // Load PDF.js only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      let mounted = true;
      let retryCount = 0;
      const maxRetries = 3;

      // Try to load PDF.js with retries
      const loadPdfjs = async () => {
        try {
          console.log("Attempting to load PDF.js...");

          // Dynamic import - PDF.js v5 uses ES modules
          const pdfjsModule = await import("pdfjs-dist");
          console.log("PDF.js module imported:", pdfjsModule);

          // PDF.js v5 - check for default export or direct export
          let pdfjs = null;
          if (pdfjsModule.default) {
            pdfjs = pdfjsModule.default;
            console.log("Using default export");
          } else if (pdfjsModule.getDocument) {
            pdfjs = pdfjsModule;
            console.log("Using direct export");
          } else {
            // Try the module itself
            pdfjs = pdfjsModule;
            console.log("Using module directly");
          }

          if (!mounted) return;

          if (!pdfjs) {
            throw new Error("PDF.js module structure not recognized");
          }

          // Log available keys for debugging
          const keys = Object.keys(pdfjs).slice(0, 20);
          console.log("PDF.js keys:", keys);
          console.log("Has getDocument:", typeof pdfjs.getDocument);
          console.log("Has version:", pdfjs.version);

          // Configure worker for PDF.js v4 - use local worker
          const workerSrc = "/pdf.worker.min.js";

          // Set worker source
          if (!pdfjs.GlobalWorkerOptions) {
            pdfjs.GlobalWorkerOptions = {};
          }
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
          console.log("PDF.js worker configured:", workerSrc);

          // Verify PDF.js is properly loaded
          const getDoc = pdfjs.getDocument || pdfjsModule.getDocument;
          if (typeof getDoc === "function") {
            // Ensure getDocument is available
            if (!pdfjs.getDocument) {
              pdfjs.getDocument = getDoc;
            }
            setPdfjsLib(pdfjs);
            setPdfjsLoading(false);
            console.log("✅ PDF.js loaded successfully!");
          } else {
            console.error("❌ PDF.js getDocument not found");
            console.error("Available functions:", keys.filter(k => typeof pdfjs[k] === 'function'));
            throw new Error("PDF.js getDocument function not found");
          }
        } catch (error) {
          console.error("❌ Failed to load PDF.js (attempt " + (retryCount + 1) + "):", error);
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);

          if (mounted && retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying PDF.js load in ${retryCount} second(s)...`);
            // Retry after a delay
            setTimeout(() => {
              if (mounted) {
                loadPdfjs();
              }
            }, 1000 * retryCount); // Exponential backoff
          } else if (mounted) {
            setPdfjsLoading(false);
            console.warn("⚠️ PDF.js failed to load after retries. PDF upload will be disabled.");
            console.warn("You can still paste your resume text manually.");
          }
        }
      };

      // Load PDF.js silently in the background (no delay, start immediately)
      loadPdfjs();

      return () => {
        mounted = false;
      };
    } else {
      setPdfjsLoading(false);
    }
  }, []);

  // Format file size for display
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Check file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword" // .doc
    ];
    const validExtensions = [".pdf", ".docx", ".doc"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert("Please upload a valid PDF, DOCX, or DOC file");
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}. Please upload a smaller file.`);
      return;
    }

    setUploadedFileName(file.name);
    setUploadedFileSize(formatFileSize(file.size));

    setPdfLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = "";

      // Handle PDF files
      if (file.type === "application/pdf" || fileExtension === ".pdf") {
        // If PDF.js is not loaded yet, try to load it now
        if (!pdfjsLib) {
          try {
            const pdfjsModule = await import("pdfjs-dist");
            const pdfjs = pdfjsModule;
            const workerSrc = "/pdf.worker.min.js";

            if (!pdfjs.GlobalWorkerOptions) {
              pdfjs.GlobalWorkerOptions = {};
            }
            pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

            if (typeof pdfjs.getDocument === "function") {
              setPdfjsLib(pdfjs);
            } else {
              throw new Error("PDF.js getDocument not available");
            }
          } catch (error) {
            console.error("Failed to load PDF.js on demand:", error);
            alert("PDF parser is not available. Please paste your resume text manually in the text area below.");
            setPdfLoading(false);
            setUploadedFileName("");
            setUploadedFileSize("");
            return;
          }
        }

        // Use getDocument with proper error handling
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          useSystemFonts: true,
        });

        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        // Extract text from all pages
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => item.str)
            .join(" ");
          extractedText += pageText + "\n";
        }
      }
      // Handle DOCX files
      else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileExtension === ".docx"
      ) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      }
      // Handle DOC files (older format)
      else if (file.type === "application/msword" || fileExtension === ".doc") {
        alert("DOC files are not directly supported. Please convert your file to DOCX or PDF format, or paste the text manually.");
        setPdfLoading(false);
        setUploadedFileName("");
        setUploadedFileSize("");
        return;
      }

      setResume(extractedText.trim());
      setPdfLoading(false);
    } catch (error) {
      console.error("Error parsing file:", error);
      alert(`Failed to parse file: ${error.message || "Unknown error"}. Please paste your resume text manually in the text area below.`);
      setPdfLoading(false);
      setUploadedFileName("");
      setUploadedFileSize("");
    }
  }

  async function handleMatch() {
    if (!resume.trim() || !job.trim()) {
      alert("Please provide both resume and job description text");
      return;
    }

    setLoading(true);
    setShowModal(true);
    setProgress(0);
    setAnalysis(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, job }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to match resume");
      }

      if (data.overallScore !== undefined) {
        // Complete progress
        clearInterval(progressInterval);
        setProgress(100);

        // Store results in sessionStorage
        sessionStorage.setItem("analysisResults", JSON.stringify(data));

        // Wait a moment to show 100% progress
        setTimeout(() => {
          setShowModal(false);
          setLoading(false);
          // Navigate to results page
          router.push("/results");
        }, 500);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error matching resume:", error);
      setShowModal(false);
      alert(`Error: ${error.message}`);
      setAnalysis(null);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-black">Resume Match</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-black hover:bg-gray-100"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 space-y-16 flex-1">
        {/* Hero Section */}
        <div className="text-center space-y-6 pt-12 pb-8">
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-black">
            Find Your Resume Match
          </h1>
          <p className="text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto leading-relaxed">
            Discover how well your resume aligns with job descriptions and get <span className="font-semibold text-blue-600">actionable insights</span> to improve your application
          </p>
          <div className="flex items-center justify-center gap-2 pt-4">
            <Badge variant="secondary" className="bg-gray-100 text-blue-600 border-blue-200">
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="bg-gray-100 text-purple-600 border-purple-200">
              Instant Results
            </Badge>
            <Badge variant="secondary" className="bg-gray-100 text-green-600 border-green-200">
              Free Analysis
            </Badge>
          </div>
        </div>

        {/* Main Analysis Card */}
        <Card className="shadow-2xl border-2 border-gray-200 bg-white">
          <CardContent className="space-y-6 pt-8">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side - Resume */}
              <div className="space-y-2">
                <label className="text-base font-semibold text-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Resume
                </label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      className="hidden"
                      id="file-upload"
                      disabled={pdfjsLoading || pdfLoading}
                    />
                    <Button
                      asChild
                      variant="outline"
                      size="default"
                      disabled={pdfLoading}
                      className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-black"
                    >
                      <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
                        <Upload className="w-4 h-4 text-blue-600" />
                        {pdfLoading ? "Processing..." : "Upload File"}
                      </label>
                    </Button>
                    {uploadedFileName && !pdfLoading && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{uploadedFileName}</span>
                          <span className="text-xs text-green-600">{uploadedFileSize}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Supported: PDF, DOCX, DOC (Max: {formatFileSize(MAX_FILE_SIZE)})
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">or</span>
                    </div>
                  </div>
                </div>
                <textarea
                  className="w-full p-4 mt-2 border-2 border-gray-200 rounded-lg bg-white text-black text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 transition-all resize-none"
                  rows={10}
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  placeholder="Paste your resume text here or upload a file above..."
                />
              </div>

              {/* Right Side - Job Description */}
              <div className="space-y-2">
                <label className="text-base font-semibold text-black flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-600" />
                  Job Description
                </label>
                <textarea
                  className="w-full p-4 mt-2 border-2 border-gray-200 rounded-lg bg-white text-black text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:border-purple-500 transition-all resize-none h-full"
                  rows={10}
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  placeholder="Paste the job description here to analyze how well your resume matches..."
                />
              </div>
            </div>

            {/* Analyze Button - Below Both Sections */}
            <div className="pt-4">
              <Button
                onClick={handleMatch}
                className="w-full bg-black text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analyze Resume Match
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How It Works Section */}
        <div id="how-it-works" className="space-y-8 py-8">
          <div className="text-center space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold text-black">How It Works</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">Get your resume analyzed in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-2 border-gray-200 bg-white hover:border-blue-300 transition-all hover:shadow-xl group">
              <CardContent className="pt-8 pb-8">
                <div className="bg-blue-300 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <div className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                  STEP 1
                </div>
                <h3 className="text-2xl font-bold mb-3 text-black">Upload Your Resume</h3>
                <p className="text-gray-700 leading-relaxed">
                  Upload your resume as a PDF or paste the text directly. Our intelligent system automatically extracts and analyzes all relevant information.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-2 border-gray-200 bg-white hover:border-purple-300 transition-all hover:shadow-xl group">
              <CardContent className="pt-8 pb-8">
                <div className="bg-purple-300 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <div className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                  STEP 2
                </div>
                <h3 className="text-2xl font-bold mb-3 text-black">Add Job Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  Paste the complete job description you&apos;re applying for. Our AI-powered engine analyzes requirements, skills, and expectations in real-time.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-2 border-gray-200 bg-white hover:border-red-300 transition-all hover:shadow-xl group">
              <CardContent className="pt-8 pb-8">
                <div className="bg-red-300 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <div className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                  STEP 3
                </div>
                <h3 className="text-2xl font-bold mb-3 text-black">Get Detailed Analysis</h3>
                <p className="text-gray-700 leading-relaxed">
                  Receive comprehensive insights including match score, skills analysis, keyword gaps, ATS compatibility, and actionable improvement recommendations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Intelligence System Section */}
        <div className="space-y-8 py-8 bg-gray-50 rounded-3xl p-8">
          <div className="text-center space-y-3">
            
            <h2 className="text-4xl md:text-5xl font-bold text-black">Intelligent Matching System</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">Powered by advanced AI and machine learning algorithms</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-2 border-gray-200 hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className=" p-4 rounded-xl shadow-lg">
                    <Brain className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-black">AI-Powered Analysis</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Our system uses advanced natural language processing and semantic analysis to understand context, not just keywords. It identifies skills, experience, and qualifications with human-like comprehension.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-2 border-gray-200 hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className=" p-4 rounded-xl shadow-lg">
                    <Zap className="w-7 h-7 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-black">Real-Time Processing</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Get instant results with our optimized matching algorithm. The system processes your resume and job description in seconds, providing immediate feedback to help you improve your application.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-2 border-gray-200 hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className=" p-4 rounded-xl shadow-lg">
                    <Target className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-black">Precision Matching</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Our algorithm calculates match scores based on multiple factors including skills alignment, keyword relevance, requirements coverage, and ATS compatibility to give you the most accurate assessment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-2 border-gray-200 hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className=" p-4 rounded-xl shadow-lg">
                    <Shield className="w-7 h-7 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-black">ATS Optimization</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Understand how Applicant Tracking Systems (ATS) will parse your resume. Get recommendations to improve ATS compatibility and increase your chances of passing automated screening.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analysis Includes Section */}
        <div className="space-y-8 py-8">
          <div className="text-center space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold text-black">What Your Analysis Includes</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">Comprehensive insights and actionable recommendations to improve your resume</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Card className="hover:shadow-lg transition-all border-2 border-gray-200 bg-white hover:border-blue-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-black">Overall Match Score</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Your total compatibility score (0-100) showing how well your resume matches the job requirements.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all border-2 border-gray-200 bg-white hover:border-green-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-bold text-black">Skills Analysis</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Percentage of job-required skills found in your resume with detailed skill-by-skill breakdown.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all border-2 border-gray-200 bg-white hover:border-purple-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-black">Requirements Coverage</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  See how many job requirements your resume addresses and identify any gaps.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all border-2 border-gray-200 bg-white hover:border-orange-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Search className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-black">Keyword Gap Matrix</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Detailed comparison showing which keywords from the job description are present or missing in your resume.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all border-2 border-gray-200 bg-white hover:border-indigo-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Award className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-black">ATS Health Score</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Both general ATS compatibility and job-specific match scores to optimize your resume for automated systems.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all border-2 border-gray-200 bg-white hover:border-red-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-bold text-black">Resume Health</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Overall quality assessment of your resume structure, formatting, and ATS-friendliness.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all border-2 border-gray-200 bg-white hover:border-teal-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="font-bold text-black">Match Rate</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Percentage of keywords matched with breakdown of keywords found vs. missing.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all border-2 border-gray-200 bg-white hover:border-yellow-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="font-bold text-black">Improvement Recommendations</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Actionable suggestions including missing keywords and ATS feedback to enhance your resume.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all border-2 border-gray-200 bg-white hover:border-pink-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-pink-100 p-2 rounded-lg">
                    <Brain className="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 className="font-bold text-black">Ranking & Insights</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  See how your resume ranks compared to other applicants and get personalized insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-bold text-black">Resume Match</span>
              </div>
              <p className="text-sm text-gray-600">
                AI-powered resume analysis to help you land your dream job.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-gray-600 hover:text-black transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      const element = document.getElementById('how-it-works');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-gray-600 hover:text-black transition-colors"
                  >
                    How It Works
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-4">Connect</h3>
              <div className="flex gap-4">
                <a
                  href="mailto:support@resumematch.com"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Resume Match. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Analysis Modal */}
      <AnalysisModal isOpen={showModal} progress={progress} />
    </div>
  );
}
