# 📚 Book Library Manager

A modern, full-stack application for managing your personal book collection. Built with NestJS, React, TypeScript, and SQLite.

**Created with Claude Sonnet 4.5 and Google Antigravity**

![Tech Stack](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

- 📖 **CRUD Operations**: Add, edit, delete, and view books
- 🔍 **Search & Filter**: Search books by title or author
- ✅ **Reading Status**: Mark books as read or unread
- 📊 **Statistics Dashboard**: View reading progress at a glance
- 🎨 **Modern UI**: Beautiful glassmorphism design with dark theme
- ⚡ **Fast & Lightweight**: SQLite database for quick setup
- ✅ **Fully Tested**: Unit and E2E tests for both frontend and backend

## 🛠️ Technology Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for database management
- **SQLite** - Lightweight SQL database
- **Jest** - Testing framework

### Frontend
- **React 18** - UI library
- **Vite** - Fast build tool
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS framework
- **Vitest** - Unit testing framework
- **Axios** - HTTP client

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-powered
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migration
npm run migration:run

# Start the backend server
npm run start:dev
```

The backend server will start on **http://localhost:3000**

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend application will start on **http://localhost:5173**

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 🧪 Running Tests

### Backend Tests

```bash
cd backend

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
ai-powered/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── books/             # Books module
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── entities/      # TypeORM entities
│   │   │   ├── books.controller.ts
│   │   │   ├── books.service.ts
│   │   │   └── books.module.ts
│   │   ├── database/          # Database configuration
│   │   │   ├── migrations/    # Database migrations
│   │   │   └── data-source.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                  # E2E tests
│   └── package.json
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service layer
│   │   ├── types/             # TypeScript types
│   │   ├── tests/             # Component tests
│   │   ├── App.tsx            # Main application
│   │   └── main.tsx           # Entry point
│   └── package.json
│
├── ai_prompts/                # AI conversation exports
└── README.md                  # This file
```

## 🔌 API Endpoints

### Books

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | Get all books (supports `?search=query`) |
| GET | `/api/books/:id` | Get a single book |
| POST | `/api/books` | Create a new book |
| PATCH | `/api/books/:id` | Update a book |
| DELETE | `/api/books/:id` | Delete a book |
| GET | `/api/books/statistics` | Get reading statistics |

### Example Request

```bash
# Create a new book
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "publishYear": 1925,
    "isRead": false
  }'
```

## 🗄️ Database

The application uses **SQLite** for data storage. The database file (`database.sqlite`) is created automatically in the backend directory when you run the migration.

### Running Migrations

```bash
cd backend

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## 🎨 Design Principles

This project follows industry best practices:

- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY (Don't Repeat Yourself)**: Reusable components and utilities
- **KISS (Keep It Simple, Stupid)**: Simple, maintainable code structure

## 🤝 Contributing

This project was created as a demonstration of full-stack development capabilities with AI assistance.

## 📝 License

MIT

## 🙏 Acknowledgments

- Created with **Claude Sonnet 4.5** and **Google Antigravity**
- Built with modern web technologies and best practices
- Designed with user experience in mind

---

**Enjoy managing your book library! 📚✨**
