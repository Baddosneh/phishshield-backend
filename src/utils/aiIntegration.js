
const axios = require('axios');

/**
 * Analyze email content for phishing using a Hugging Face model.
 * @param {string} emailContent - The email text to analyze.
 * @returns {Promise<Object>} - The model's prediction result.
 */
async function analyzeEmail(emailContent) {
    try {
        const response = await axios.post(
            'http://localhost:5001/analyze_email',
            { email_text: emailContent },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error analyzing email:', error?.response?.data || error.message);
        throw new Error('Email phishing analysis failed');
    }
}

/**
 * Analyze a URL for phishing using the same AI endpoint as email analysis.
 * @param {string} url - The URL to check.
 * @returns {Promise<Object>} - The AI model's prediction result.
 */
async function analyzeURL(url) {
    try {
        const response = await axios.post(
            'http://localhost:5001//analyze_url',
            { url }, // Send the URL for unified processing
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error analyzing URL:', error?.response?.data || error.message);
        throw new Error('URL phishing analysis failed');
    }
}

module.exports = {
    analyzeEmail,
    analyzeURL,
};
