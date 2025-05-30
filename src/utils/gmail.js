const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load OAuth2 credentials from a file (downloaded from Google Cloud Console)
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../gmail-token.json');

function getOAuth2Client() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

// Generate Auth URL for user consent
function getAuthUrl() {
    const oAuth2Client = getOAuth2Client();
    const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
}

// Exchange code for tokens and save them
async function saveToken(code) {
    const oAuth2Client = getOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
}

// Load tokens and return authenticated client
function getAuthenticatedClient() {
    const oAuth2Client = getOAuth2Client();
    if (fs.existsSync(TOKEN_PATH)) {
        const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oAuth2Client.setCredentials(tokens);
        return oAuth2Client;
    }
    return null;
}

// Fetch emails (list messages)
async function listEmails(auth, query = '', maxResults = 10) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
    });
    return res.data.messages || [];
}

// Fetch a single email's details
async function getEmail(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
    });
    return res.data;
}

module.exports = {
    getAuthUrl,
    saveToken,
    getAuthenticatedClient,
    listEmails,
    getEmail,
};