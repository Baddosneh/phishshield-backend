
const axios = require('axios');

/**
 * Analyze email content for phishing using a Hugging Face model.
 * @param {string} emailContent - The email text to analyze.
 * @returns {Promise<Object>} - The model's prediction result.
 */
async function analyzeEmail(emailContent) {
    try {
        const response = await axios.post(
            `${process.env.EMAIL_ANALYZER_URL}/analyze_email`,
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
 * @param {string} url - The URL to analyze for phishing.
 * @returns {Promise<Object>} - The AI model's prediction result.
 */
async function analyzeURL(url) {
    try {
        const response = await axios.post(
            `${process.env.URL_ANALYZER_URL}/analyze_url`,
            { url }, 
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


/**
 * Analyze email content for phishing using a Hugging Face model.
 * @param {string} textInput - The sms text to analyze.
 * @returns {Promise<Object>} - The model's prediction result.
 */
async function analyzeText(textInput) {
    try {
        const response = await axios.post(
            `${process.env.SMS_ANALYZER_URL}/analyze_sms`,
            { sms_text: textInput },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error analyzing sms:', error?.response?.data || error.message);
        throw new Error('sms phishing analysis failed');
    }
}
//new comments
module.exports = {
    analyzeEmail,
    analyzeURL,
    analyzeText,
};
