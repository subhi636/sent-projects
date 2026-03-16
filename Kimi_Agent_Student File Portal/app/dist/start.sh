#!/bin/bash

echo "=========================================="
echo "  Sent Projects - مرقع"
echo "  Student Files Management System"
echo "=========================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "Starting server..."
cd server
npm install
node server.js &
SERVER_PID=$!
cd ..

echo "Server started on http://localhost:3001"
echo ""
echo "Waiting for server to initialize..."
sleep 3

echo ""
echo "=========================================="
echo "  Server is running!"
echo "  API: http://localhost:3001"
echo ""
echo "  To access the website:"
echo "  1. Open your browser"
echo "  2. Navigate to: http://localhost:3001"
echo ""
echo "  Admin Login:"
echo "  Email: subhi20102005@gmail.com"
echo "  Password: Qw07750783066w2005/4/15S"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

wait $SERVER_PID
