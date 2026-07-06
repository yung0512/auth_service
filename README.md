# A Simple Auth Service

This is a simple authentication service built with Node.js and Express. It provides basic user authentication features such as registration, login, and token-based authentication.

## Development

### Framework

Backend: Typescript with Express framework
Frontend: React.js

### Installation

Install Docker and Docker Compose on your machine.

```
docker-compose up
```

## Flow

1. User registers with email and password.
2. User logs in with email and password.
3. Server generates a JWT token and sends it back to the user.
4. User includes the JWT token in the Authorization header for subsequent requests to protected routes.

### API Endpoints
