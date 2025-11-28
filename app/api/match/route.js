export async function POST(req) {
  try {
    const { resume, job } = await req.json();

    if (!resume || !job) {
      return Response.json(
        { error: "Resume and job description are required" },
        { status: 400 }
      );
    }

    // Get Hugging Face token from environment variable
    const HF_TOKEN = process.env.HF_TOKEN;

    if (!HF_TOKEN) {
      return Response.json(
        { error: "Hugging Face token is not configured. Please set HF_TOKEN in your environment variables." },
        { status: 500 }
      );
    }

    // Hugging Face model name
    const MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2";

    // Try different endpoint formats
    const ENDPOINTS = [
      `https://router.huggingface.co/models/${MODEL_NAME}`,
      `https://router.huggingface.co/${MODEL_NAME}`,
      `https://api-inference.huggingface.co/models/${MODEL_NAME}`,
    ];

    // Comprehensive text analysis function
    function analyzeResume(resume, job) {
      // Normalize text
      const normalize = (text) => text.toLowerCase().replace(/[^\w\s]/g, ' ');
      const resumeNorm = normalize(resume);
      const jobNorm = normalize(job);

      // Extract keywords (words longer than 3 characters, excluding common words)
      const commonWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'will', 'your', 'their', 'there', 'these', 'those', 'which', 'where', 'when', 'what', 'would', 'could', 'should']);
      const getKeywords = (text) => {
        const words = text.split(/\s+/)
          .filter(w => w.length > 3 && !commonWords.has(w))
          .map(w => w.trim());
        return [...new Set(words)]; // Remove duplicates
      };

      const resumeKeywords = getKeywords(resumeNorm);
      const jobKeywords = getKeywords(jobNorm);

      // Find matching keywords
      const matchingKeywords = [];
      const missingKeywords = [];

      jobKeywords.forEach(keyword => {
        // Check for exact match
        if (resumeKeywords.includes(keyword)) {
          matchingKeywords.push(keyword);
        } else {
          // Check for partial match
          const found = resumeKeywords.find(rk =>
            rk.includes(keyword) || keyword.includes(rk)
          );
          if (found) {
            matchingKeywords.push(keyword);
          } else {
            missingKeywords.push(keyword);
          }
        }
      });

      // Calculate scores
      const matchRate = jobKeywords.length > 0
        ? Math.round((matchingKeywords.length / jobKeywords.length) * 100)
        : 0;

      // Overall score (weighted)
      const overallScore = Math.round(matchRate * 0.7 + (100 - (missingKeywords.length * 2)));
      const finalOverallScore = Math.min(100, Math.max(0, overallScore));

      // Top percentage (inverse of score, higher score = lower percentage rank)
      const topPercentage = Math.max(0, Math.min(100, 100 - finalOverallScore));

      // Skills score - percentage of job-required skills found in resume
      // Extract technical/skill-related keywords from job description
      const technicalKeywords = ['development', 'programming', 'coding', 'software', 'design', 'debugging', 'troubleshooting', 'framework', 'library', 'api', 'database', 'frontend', 'backend', 'fullstack', 'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'testing', 'ci/cd', 'devops', 'html', 'css', 'typescript', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'machine learning', 'ai', 'data science', 'analytics', 'ux', 'ui', 'figma', 'sketch', 'photoshop'];
      
      // Find technical keywords mentioned in the job description
      const jobTechnicalKeywords = jobKeywords.filter(jk =>
        technicalKeywords.some(tk => 
          jk.includes(tk) || tk.includes(jk) || 
          jk.toLowerCase().includes(tk.toLowerCase()) || 
          tk.toLowerCase().includes(jk.toLowerCase())
        )
      );
      
      // Also check for common skill patterns in job description
      const skillPatterns = /(?:proficient|experienced|knowledge|familiar|expert|skilled|ability|capable|competent).*?(?:in|with|at)\s+([a-z\s]+)/gi;
      const skillMatches = [...jobNorm.matchAll(skillPatterns)];
      skillMatches.forEach(match => {
        const skill = match[1]?.trim();
        if (skill && skill.length > 3 && !jobTechnicalKeywords.includes(skill)) {
          jobTechnicalKeywords.push(skill);
        }
      });
      
      // Count how many job-required technical skills are found in resume
      const skillsFoundInResume = jobTechnicalKeywords.filter(jtk =>
        resumeKeywords.some(rk =>
          rk.includes(jtk) || jtk.includes(rk) ||
          rk.toLowerCase().includes(jtk.toLowerCase()) ||
          jtk.toLowerCase().includes(rk.toLowerCase())
        )
      ).length;
      
      // Calculate percentage: (skills found / skills required) * 100
      const totalJobSkills = jobTechnicalKeywords.length > 0 ? jobTechnicalKeywords.length : 1;
      const skillsScore = Math.min(100, Math.round((skillsFoundInResume / totalJobSkills) * 100));

      // Requirements met (based on job requirements structure)
      const requirements = jobNorm.split(/[.!?]/).filter(s => s.trim().length > 10);
      const requirementsMet = Math.round((matchingKeywords.length / Math.max(1, jobKeywords.length)) * 100);

      // Keywords score
      const keywordsScore = matchRate;

      // ATS Health (match-specific - how well resume performs for THIS job)
      const atsHealth = Math.round((finalOverallScore * 0.6) + (matchRate * 0.4));

      // Resume ATS Health (general - how ATS-friendly is the resume overall)
      const hasProperSections = resume.match(/(experience|education|skills|summary|objective)/gi);
      const hasBulletPoints = resume.includes('•') || resume.includes('-') || resume.includes('*');
      const hasNumbers = (resume.match(/\d+/g) || []).length;
      const wordCount = resume.split(/\s+/).length;
      const hasActionVerbs = resume.match(/(developed|created|managed|led|designed|implemented|built|improved|increased|reduced)/gi);

      const resumeAtsHealth = Math.min(100, Math.round(
        (hasProperSections ? 25 : 0) +
        (hasBulletPoints ? 15 : 0) +
        (hasNumbers > 5 ? 15 : hasNumbers > 2 ? 10 : 5) +
        (wordCount > 300 ? 20 : wordCount > 150 ? 10 : 0) +
        (hasActionVerbs ? 15 : 0) +
        (resumeKeywords.length > 30 ? 10 : resumeKeywords.length > 15 ? 5 : 0)
      ));

      // Generate ATS Feedback
      const atsFeedback = [];

      // Check for formatting issues
      if (!hasProperSections) {
        atsFeedback.push({
          type: 'critical',
          category: 'Structure',
          message: 'Add standard section headers like "Experience", "Education", "Skills"',
          impact: 'high'
        });
      }

      if (!hasBulletPoints) {
        atsFeedback.push({
          type: 'warning',
          category: 'Formatting',
          message: 'Use bullet points to list achievements and responsibilities',
          impact: 'medium'
        });
      }

      if (hasNumbers < 3) {
        atsFeedback.push({
          type: 'warning',
          category: 'Content',
          message: 'Add quantifiable achievements (e.g., "Increased sales by 25%")',
          impact: 'medium'
        });
      }

      if (!hasActionVerbs || hasActionVerbs.length < 5) {
        atsFeedback.push({
          type: 'warning',
          category: 'Content',
          message: 'Use more action verbs (developed, managed, led, created, etc.)',
          impact: 'medium'
        });
      }

      if (wordCount < 200) {
        atsFeedback.push({
          type: 'critical',
          category: 'Content',
          message: 'Resume is too short. Aim for at least 300-500 words',
          impact: 'high'
        });
      }

      // Keyword-specific feedback
      if (missingKeywords.length > 10) {
        atsFeedback.push({
          type: 'critical',
          category: 'Keywords',
          message: `Add ${missingKeywords.length} missing keywords from job description`,
          impact: 'high'
        });
      } else if (missingKeywords.length > 5) {
        atsFeedback.push({
          type: 'warning',
          category: 'Keywords',
          message: `Include ${missingKeywords.length} more relevant keywords`,
          impact: 'medium'
        });
      }

      if (matchRate < 30) {
        atsFeedback.push({
          type: 'critical',
          category: 'Match',
          message: 'Low keyword match. Tailor your resume to this specific job',
          impact: 'high'
        });
      }

      // Technical skills feedback
      if (skillsFoundInResume < 3) {
        atsFeedback.push({
          type: 'info',
          category: 'Skills',
          message: 'Add more technical skills relevant to the position',
          impact: 'low'
        });
      }

      // Positive feedback
      if (resumeAtsHealth >= 80) {
        atsFeedback.push({
          type: 'success',
          category: 'Overall',
          message: 'Excellent ATS-friendly resume structure!',
          impact: 'positive'
        });
      }

      if (matchRate >= 70) {
        atsFeedback.push({
          type: 'success',
          category: 'Match',
          message: 'Strong keyword match with job description',
          impact: 'positive'
        });
      }

      // Resume Health (based on keyword presence and structure)
      const resumeHealth = Math.min(100, Math.round(
        (resumeKeywords.length > 0 ? 30 : 0) +
        (matchingKeywords.length > 0 ? 40 : 0) +
        (resume.length > 500 ? 15 : 0) +
        (resume.length > 1000 ? 15 : 0)
      ));

      // Keyword Gap Matrix
      const keywordMatrix = jobKeywords.map(keyword => ({
        keyword,
        inResume: matchingKeywords.includes(keyword),
        inJob: true
      }));

      // Get grade for scores
      const getGrade = (score) => {
        if (score >= 90) return 'EXCELLENT';
        if (score >= 70) return 'GOOD';
        if (score >= 50) return 'FAIR';
        return 'NEEDS IMPROVEMENT';
      };

      return {
        overallScore: finalOverallScore,
        topPercentage: Math.round(topPercentage),
        skillsScore,
        skillsGrade: getGrade(skillsScore),
        requirementsMet,
        keywordsScore,
        keywordsGrade: getGrade(keywordsScore),
        atsHealth, // Match-specific ATS score
        resumeAtsHealth, // General resume ATS score
        atsFeedback, // Detailed feedback array
        matchRate,
        keywordsPresent: matchingKeywords.length,
        keywordsMissing: missingKeywords.length,
        keywordMatrix,
        resumeHealth,
        matchingKeywords,
        missingKeywords
      };
    }

    // Convert text → embeddings using Hugging Face API
    async function getEmbedding(text, retries = 2) {
      let lastError = null;

      // Try each endpoint format
      for (const endpoint of ENDPOINTS) {
        for (let attempt = 0; attempt < retries; attempt++) {
          let res = null;
          let data = null;

          try {
            console.log(`Trying endpoint: ${endpoint} (attempt ${attempt + 1})`);
            res = await fetch(endpoint, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ inputs: text }),
            });

            // Get response as text first to check for deprecation messages
            const responseText = await res.text();

            // Check for deprecation message
            if (responseText.includes("no longer supported")) {
              if (endpoint.includes("api-inference.huggingface.co")) {
                console.log(`Endpoint ${endpoint} is deprecated, trying next...`);
                lastError = new Error("Endpoint deprecated");
                break; // Try next endpoint
              }
            }

            // Check for 404 immediately
            if (res.status === 404) {
              if (endpoint !== ENDPOINTS[ENDPOINTS.length - 1]) {
                console.log(`Endpoint ${endpoint} returned 404, trying next...`);
                lastError = new Error(`404 Not Found: ${endpoint}`);
                break; // Try next endpoint
              }
              throw new Error(`404 Not Found: Model ${MODEL_NAME} not available on any endpoint`);
            }

            // Try to parse as JSON
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              if (!res.ok) {
                throw new Error(
                  `API returned non-JSON response (${res.status}): ${responseText.substring(0, 200)}`
                );
              }
              throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
            }

            // Handle case where model is loading (503 or error with estimated_time)
            if (res.status === 503 || (data.error && data.estimated_time)) {
              const waitTime = data.estimated_time ? Math.ceil(data.estimated_time) : 10;
              if (attempt < retries - 1) {
                console.log(`Model loading, waiting ${waitTime} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                continue; // Retry
              }
              throw new Error(
                `Model is loading. Please wait ${waitTime} seconds and try again.`
              );
            }

            // Handle other errors
            if (!res.ok) {
              throw new Error(
                data.error || data.message || `Hugging Face API error: ${res.statusText}`
              );
            }

            // Hugging Face returns embeddings as a 2D array: [[embedding1], [embedding2], ...]
            if (!Array.isArray(data)) {
              throw new Error(`Invalid embedding response: expected array, got ${typeof data}`);
            }

            // Extract the first embedding array
            const embedding = data[0];
            if (!Array.isArray(embedding)) {
              throw new Error(`Invalid embedding format: expected array of numbers`);
            }

            console.log(`Successfully got embedding from ${endpoint}`);
            return embedding;
          } catch (error) {
            lastError = error;
            console.error(`Error on ${endpoint} (attempt ${attempt + 1}):`, error.message);

            // If it's an authentication error, don't retry
            if (error.message.includes("401") || error.message.includes("Unauthorized")) {
              throw error;
            }

            // If it's a deprecation error and not the last endpoint, try next
            if (error.message.includes("deprecated") || error.message.includes("no longer supported")) {
              if (endpoint !== ENDPOINTS[ENDPOINTS.length - 1]) {
                break; // Try next endpoint
              }
              throw error;
            }

            // If it's a 404 and not the last endpoint, try next
            if (error.message.includes("404") || error.message.includes("Not Found")) {
              if (endpoint !== ENDPOINTS[ENDPOINTS.length - 1]) {
                break; // Try next endpoint
              }
            }

            // If it's the last attempt for this endpoint
            if (attempt === retries - 1) {
              if (endpoint === ENDPOINTS[ENDPOINTS.length - 1]) {
                throw error;
              }
              break;
            }

            // If model is loading, wait and retry
            if (res?.status === 503 ||
              error.message.includes("loading") ||
              (data?.error && data?.estimated_time)) {
              const waitTime = data?.estimated_time ? Math.ceil(data.estimated_time) : 10;
              await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
              continue;
            }

            // For other errors, wait a bit and retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      // If we get here, all endpoints failed
      throw lastError || new Error("Failed to get embedding after all retries");
    }

    // Always use comprehensive text analysis
    const analysis = analyzeResume(resume, job);

    // Try to enhance with API embeddings if available
    let apiScore = null;
    try {
      const embResume = await getEmbedding(resume);
      const embJob = await getEmbedding(job);

      function cosineSimilarity(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
          return null;
        }

        let dot = 0.0;
        let normA = 0.0;
        let normB = 0.0;

        for (let i = 0; i < a.length; i++) {
          dot += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        if (denominator === 0) {
          return 0;
        }

        return dot / denominator;
      }

      apiScore = cosineSimilarity(embResume, embJob);
      if (apiScore !== null) {
        // Blend API score with text analysis (70% API, 30% text analysis)
        analysis.overallScore = Math.round((apiScore * 100 * 0.7) + (analysis.overallScore * 0.3));
      }
    } catch (apiError) {
      console.log("API failed, using text-based analysis:", apiError.message);
    }

    return Response.json({
      ...analysis,
      status: "success",
      method: apiScore !== null ? "api" : "text",
    });
  } catch (e) {
    console.error("Match API error:", e);
    console.error("Error stack:", e.stack);
    return Response.json(
      {
        error: e.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? e.stack : undefined
      },
      { status: 500 }
    );
  }
}
