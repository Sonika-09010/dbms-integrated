const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-2.5-flash";

const askGemini = async (prompt) => {
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt
    });

    return response.text;
};

const summarizePaper = async (paperText) => {
    if (!paperText) {
        throw new Error("Paper text is required");
    }

    const prompt = `
Summarize the following research paper clearly.

Include:
1. Objective
2. Methodology
3. Dataset or data used
4. Main results
5. Conclusion

Keep the summary concise and factual.

Research paper:
${paperText}
`;

    return await askGemini(prompt);
};

const recommendSession = async (paperTitle, paperAbstract) => {
    if (!paperTitle || !paperAbstract) {
        throw new Error("Paper title and abstract are required");
    }

    const prompt = `
You are helping organize an academic conference.

Based on the research paper below, recommend the most suitable conference session or topic.

Paper title:
${paperTitle}

Abstract:
${paperAbstract}

Return:
- Recommended session/topic
- Short reason
`;

    return await askGemini(prompt);
};

const recommendReviewer = async (
    paperTitle,
    paperAbstract,
    reviewerExpertise
) => {
    if (!paperTitle || !paperAbstract || !reviewerExpertise) {
        throw new Error(
            "Paper title, abstract and reviewer expertise are required"
        );
    }

    const prompt = `
Determine how suitable this reviewer is for reviewing the research paper.

Paper title:
${paperTitle}

Paper abstract:
${paperAbstract}

Reviewer expertise:
${reviewerExpertise}

Return:
- Suitability: High, Medium, or Low
- Short reason
`;

    return await askGemini(prompt);
};

module.exports = {
    askGemini,
    summarizePaper,
    recommendSession,
    recommendReviewer
};