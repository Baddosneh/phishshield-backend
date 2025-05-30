
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const User = require('../models/User'); // Adjust path as needed
const authMiddleware = require('../middleware/auth');
const { analyzeEmail } = require('../utils/aiIntegration');


const CREDENTIALS_PATH = require('path').join(__dirname, '../../credentials.json');
const fs = require('fs');

// Helper to get OAuth2 client
function getOAuth2Client() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;
    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

// 1. Initiate OAuth2 flow (user must be logged in)
router.get('/connect', authMiddleware, (req, res) => {
    const oAuth2Client = getOAuth2Client();
    const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
    const url = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state: req.user._id.toString()
    });
    res.redirect(url);
});

// 2. Handle OAuth2 callback and save tokens per user
router.get('/callback', async (req, res) => {
    const code = req.query.code;
    const userId = req.query.state;
    if (!code || !userId) {
        return res.status(400).send('Missing code or userId parameter');
    }
    try {
        const oAuth2Client = getOAuth2Client();
        const { tokens } = await oAuth2Client.getToken(code);
        // Save tokens to the authenticated user
        await User.findByIdAndUpdate(userId, { gmailTokens: tokens });
        res.redirect('https://phishield-seven.vercel.app/dashboard?gmail=success');
    } catch (err) {
        console.error('Error saving token:', err);
        res.status(500).send('Failed to authenticate with Gmail');
    }
});

// Helper to get authenticated Gmail client for a user
async function getUserGmailClient(userId) {
    const user = await User.findById(userId);
    if (!user || !user.gmailTokens) return null;
    const oAuth2Client = getOAuth2Client();
    oAuth2Client.setCredentials(user.gmailTokens);
    // Optionally refresh token if needed
    return oAuth2Client;
}

// 3. Fetch emails (requires authentication)
router.get('/emails', authMiddleware, async (req, res) => {
    try {

         const user = await User.findById(req.user._id);
          if (!user || !user.plan) {
           return res.status(403).json({ error: 'Gmail integration is available for premium users only.' });
         }

        const auth = await getUserGmailClient(req.user._id);
        if (!auth) {
            return res.status(401).send('Not authenticated with Gmail');
        }
        const gmail = google.gmail({ version: 'v1', auth });
        const messagesRes = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 20,
            labelIds: ['INBOX'] 
        });
        const messages = messagesRes.data.messages || [];
        const emails = await Promise.all(
            messages.map(msg => gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' }).then(res => res.data))
        );
        res.json(emails);
    } catch (err) {
        console.error('Error fetching emails:', err);
        res.status(500).send('Failed to fetch emails');
    }
});

router.get('/auth-url', authMiddleware, (req, res) => {
  const oAuth2Client = getOAuth2Client();
  const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
  const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: req.user._id.toString()

  });
  res.json({ url });
});


router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { emails } = req.body; 
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'No emails provided' });
    }
    const results = await Promise.all(
      emails.map(async (email) => {
        const analysis = await analyzeEmail(email.snippet || email.body || '');
        return { ...email, analysis };
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze emails' });
  }
});
module.exports = router;
