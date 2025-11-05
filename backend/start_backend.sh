#!/bin/bash
# Backend startup script

cd "$(dirname "$0")"
source venv/bin/activate
uvicorn app:app --reload --port 5000

