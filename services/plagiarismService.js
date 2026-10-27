const calculateSimilarity = (text1, text2) => {
    if (!text1 || !text2) {
        return 0;
    }

    const words1 = new Set(
        text1
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter(Boolean)
    );

    const words2 = new Set(
        text2
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter(Boolean)
    );

    const intersection = [...words1].filter(word => words2.has(word));

    const union = new Set([...words1, ...words2]);

    if (union.size === 0) {
        return 0;
    }

    return Number(
        ((intersection.length / union.size) * 100).toFixed(2)
    );
};

const checkPlagiarism = (paperText, existingTexts = []) => {
    if (!paperText) {
        throw new Error("Paper text is required");
    }

    let highestSimilarity = 0;

    for (const existingText of existingTexts) {
        const similarity = calculateSimilarity(
            paperText,
            existingText
        );

        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
        }
    }

    return {
        similarity_percentage: highestSimilarity,
        status:
            highestSimilarity >= 30
                ? "Potential plagiarism"
                : "No significant similarity detected"
    };
};

module.exports = {
    calculateSimilarity,
    checkPlagiarism
};