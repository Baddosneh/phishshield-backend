# PhishShield AI - Backend Documentation

## Overview
PhishShield AI is a SaaS web application designed to detect phishing attempts through email, links, and attachments using open-source AI. The backend is built using Express.js and MongoDB, providing a robust API for the frontend to interact with.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- MongoDB (local or cloud instance)
- npm (Node package manager)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd phishshield-ai/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Configuration
- Create a `.env` file in the `backend` directory to store environment variables. Example:
  ```
  PORT=5000
  MONGODB_URI=<your_mongodb_connection_string>
  JWT_SECRET=<your_jwt_secret>
  ```

### Running the Application
To start the backend server, run:
```
npm start
```
The server will run on the specified port (default is 5000).

### API Endpoints
- **Authentication**
  - `POST /register`: Register a new user
  - `POST /login`: Authenticate a user

- **Scan Operations**
  - `POST /scan/email`: Process email content with AI
  - `POST /scan/url`: Analyze webpage safety

- **User History**
  - `GET /history`: Retrieve scan history for the authenticated user

### Middleware
The application uses JWT for authentication. Ensure to include the token in the headers for protected routes.

### Testing
To run tests, use:
```
npm test
```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.