"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, AlertTriangle, Info, CheckCircle, Circle, HelpCircle, TrendingUp, Target, FileText, Search, Award, ArrowLeft } from "lucide-react";

export default function ResultsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [analysis, setAnalysis] = useState(null);

    useEffect(() => {
        // Try to get data from sessionStorage
        const storedData = sessionStorage.getItem("analysisResults");
        if (storedData) {
            setAnalysis(JSON.parse(storedData));
        } else {
            // If no data, redirect to home
            router.push("/");
        }
    }, [router]);

    if (!analysis) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Back to Home Button */}
                <div className="mb-4">
                    <Button 
                        onClick={() => router.push("/")} 
                        variant="ghost" 
                        className="text-gray-700 hover:text-black hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resume Analysis Results</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Detailed breakdown of how your resume matches the job description
                        </p>
                    </div>
                    <Button onClick={() => router.push("/")} variant="outline">
                        Analyze Another
                    </Button>
                </div>

                {/* Quick Summary Info */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-2">Understanding Your Scores</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• <strong>Overall Match Score:</strong> Your total compatibility with this job (0-100)</li>
                                    <li>• <strong>Top X%:</strong> Your resume ranks better than X% of other applicants</li>
                                    <li>• <strong>Skills Match:</strong> % of job-required skills found in your resume</li>
                                    <li>• <strong>Requirements:</strong> % of job requirements your resume covers</li>
                                    <li>• <strong>Keywords:</strong> % of important keywords from job description in your resume</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Overall Score */}
                <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg">
                    <CardContent className="pt-8 pb-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-4 rounded-full">
                                    <Target className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-5xl font-bold text-gray-900">{analysis.overallScore}</h2>
                                        <span className="text-2xl text-gray-500">/ 100</span>
                                    </div>
                                    <CardDescription className="mt-2 text-base">
                                        Overall Match Score
                                    </CardDescription>
                                    <p className="text-sm text-gray-600 mt-1">
                                        How well your resume matches this job description
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-green-100 p-4 rounded-full">
                                    <Award className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="text-center md:text-right">
                                    <div className="flex items-baseline gap-2 justify-center md:justify-end">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        <p className="text-2xl font-bold text-green-600">Top {analysis.topPercentage}%</p>
                                    </div>
                                    <CardDescription className="mt-2 text-base">
                                        Match Strength
                                    </CardDescription>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Better than {100 - analysis.topPercentage}% of resumes
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metrics Grid */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Detailed Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-green-100 p-2 rounded-lg">
                                            <Target className="w-4 h-4 text-green-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">Skills Match</p>
                                    </div>
                                    <HelpCircle className="w-4 h-4 text-gray-400" title="Percentage of job-required skills found in your resume" />
                                </div>
                                <p className="text-3xl font-bold text-green-600 mb-2">{analysis.skillsScore}%</p>
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                    {analysis.skillsGrade}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-2">Job skills in resume</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <CheckCircle className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">Requirements</p>
                                    </div>
                                    <HelpCircle className="w-4 h-4 text-gray-400" title="Percentage of job requirements met by your resume" />
                                </div>
                                <p className="text-3xl font-bold text-blue-600 mb-2">{analysis.requirementsMet}%</p>
                                <CardDescription className="mt-1">Requirements Met</CardDescription>
                                <p className="text-xs text-gray-500 mt-2">Job requirements covered</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-purple-100 p-2 rounded-lg">
                                            <Search className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">Keywords</p>
                                    </div>
                                    <HelpCircle className="w-4 h-4 text-gray-400" title="Percentage of important keywords from job description found in your resume" />
                                </div>
                                <p className="text-3xl font-bold text-purple-600 mb-2">{analysis.keywordsScore}%</p>
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                                    {analysis.keywordsGrade}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-2">Keywords matched</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-orange-100 p-2 rounded-lg">
                                            <FileText className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">Resume ATS</p>
                                    </div>
                                    <HelpCircle className="w-4 h-4 text-gray-400" title="How ATS-friendly your resume is in general (structure, formatting, keywords)" />
                                </div>
                                <p className="text-3xl font-bold text-orange-600 mb-2">{analysis.resumeAtsHealth}%</p>
                                <CardDescription className="mt-1">General ATS Score</CardDescription>
                                <p className="text-xs text-gray-500 mt-2">Resume quality score</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-indigo-100 p-2 rounded-lg">
                                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">Match ATS</p>
                                    </div>
                                    <HelpCircle className="w-4 h-4 text-gray-400" title="How well your resume matches this specific job for ATS systems" />
                                </div>
                                <p className="text-3xl font-bold text-indigo-600 mb-2">{analysis.atsHealth}%</p>
                                <CardDescription className="mt-1">Job-Specific Match</CardDescription>
                                <p className="text-xs text-gray-500 mt-2">Match for this job</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Match Rate */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-blue-600" />
                            <CardTitle>Keyword Match Rate</CardTitle>
                        </div>
                        <CardDescription>
                            How many keywords from the job description appear in your resume
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">Match Rate</span>
                            <span className="text-2xl font-bold text-blue-600">{analysis.matchRate}%</span>
                        </div>
                        <Progress value={analysis.matchRate} className="h-3 mb-4" />
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{analysis.keywordsPresent}</p>
                                <p className="text-xs text-gray-600 mt-1">Keywords Found</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">{analysis.keywordsMissing}</p>
                                <p className="text-xs text-gray-600 mt-1">Keywords Missing</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Keyword Gap Matrix */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-purple-600" />
                            <CardTitle>Keyword Gap Matrix</CardTitle>
                        </div>
                        <CardDescription>
                            See exactly which keywords from the job description are in your resume (✓) and which are missing (—)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Keyword</TableHead>
                                    <TableHead className="text-center">In Resume</TableHead>
                                    <TableHead className="text-center">In Job</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysis.keywordMatrix.slice(0, 20).map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{item.keyword}</TableCell>
                                        <TableCell className="text-center">
                                            {item.inResume ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    ✓
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                ✓
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {analysis.keywordMatrix.length > 20 && (
                            <p className="text-xs text-muted-foreground mt-4 text-center">
                                Showing first 20 of {analysis.keywordMatrix.length} keywords
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Resume Health */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            <CardTitle>Resume Health Score</CardTitle>
                        </div>
                        <CardDescription>
                            Overall quality and ATS-friendliness of your resume structure and formatting
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">Health Score</span>
                            <span className="text-2xl font-bold text-green-600">{analysis.resumeHealth}%</span>
                        </div>
                        <Progress value={analysis.resumeHealth} className="h-3" />
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div className="flex items-center gap-2 text-gray-600">
                                <div className={`w-2 h-2 rounded-full ${analysis.resumeHealth >= 80 ? 'bg-green-500' : analysis.resumeHealth >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                <span>Structure & Format</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <div className={`w-2 h-2 rounded-full ${analysis.resumeHealth >= 80 ? 'bg-green-500' : analysis.resumeHealth >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                <span>Keyword Density</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <div className={`w-2 h-2 rounded-full ${analysis.resumeHealth >= 80 ? 'bg-green-500' : analysis.resumeHealth >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                <span>ATS Compatibility</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* What Needs Improvement */}
                {analysis.missingKeywords.length > 0 && (
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-700" />
                                <CardTitle className="text-yellow-800">Improvement Opportunities</CardTitle>
                            </div>
                            <CardDescription className="text-yellow-700">
                                Add these keywords from the job description to your resume to increase your match score
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                                <p className="text-sm font-semibold text-yellow-900 mb-1">
                                    💡 Quick Tip:
                                </p>
                                <p className="text-xs text-yellow-800">
                                    Naturally incorporate these keywords into your experience descriptions, skills section, or summary. Don't just list them—show how you've used them.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {analysis.missingKeywords.slice(0, 15).map((keyword, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 transition-colors"
                                    >
                                        {keyword}
                                    </Badge>
                                ))}
                                {analysis.missingKeywords.length > 15 && (
                                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                        +{analysis.missingKeywords.length - 15} more keywords
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-yellow-700 mt-3">
                                Adding these {analysis.missingKeywords.length} keywords could improve your match score significantly.
                            </p>
                        </CardContent>
                    </Card>
                )}
                {/* ATS Feedback */}
                {analysis.atsFeedback && analysis.atsFeedback.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="text-blue-900">ATS Feedback & Recommendations</CardTitle>
                            <CardDescription className="text-blue-700">
                                Actionable insights to improve your resume's ATS compatibility
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analysis.atsFeedback.map((feedback, idx) => {
                                    const getIcon = (type) => {
                                        if (type === 'critical') return <AlertCircle className="w-5 h-5 text-red-600" />;
                                        if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
                                        if (type === 'info') return <Info className="w-5 h-5 text-blue-600" />;
                                        if (type === 'success') return <CheckCircle className="w-5 h-5 text-green-600" />;
                                        return <Circle className="w-5 h-5 text-gray-400" />;
                                    };

                                    const getBgColor = (type) => {
                                        if (type === 'critical') return 'bg-red-50 border-red-200';
                                        if (type === 'warning') return 'bg-yellow-50 border-yellow-200';
                                        if (type === 'info') return 'bg-blue-50 border-blue-200';
                                        if (type === 'success') return 'bg-green-50 border-green-200';
                                        return 'bg-gray-50 border-gray-200';
                                    };

                                    const getTextColor = (type) => {
                                        if (type === 'critical') return 'text-red-800';
                                        if (type === 'warning') return 'text-yellow-800';
                                        if (type === 'info') return 'text-blue-800';
                                        if (type === 'success') return 'text-green-800';
                                        return 'text-gray-800';
                                    };

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-lg border ${getBgColor(feedback.type)}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="flex-shrink-0 mt-0.5">{getIcon(feedback.type)}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {feedback.category}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs capitalize">
                                                            {feedback.impact} impact
                                                        </Badge>
                                                    </div>
                                                    <p className={`text-sm font-medium ${getTextColor(feedback.type)}`}>
                                                        {feedback.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Button */}
                <div className="flex justify-center pt-4">
                    <Button onClick={() => router.push("/")} size="lg" className="w-full md:w-auto">
                        Analyze Another Resume
                    </Button>
                </div>
            </div >
        </div >
    );
}
