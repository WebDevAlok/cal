# FastAPI Application

## Overview
This FastAPI application is designed to handle video transcript processing and generate questions, including analytical case study-based MCQs. The application leverages LLMs for generating high-quality, exam-level questions from transcript content.


## Installation

1. Clone the repository and switch to the directory "ai_engine":
   ```bash
   git clone https://github.com/sudarshansudarshan/cal.git
   cd cal/backend/ai_engine
   ```
2. Create a virtual environment and activate it.
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the application:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

5. The application can be accessed at "127.0.0.1:8000/".

## Start the Dummy Server

1. Change the directory to dummy_server
   ```bash
   cd dummy_server
   ```

2. Install the requirements
   ```bash
   pip install -r  requirements.txt
   ```
3. Run the server
   ```bash
   python server.py
   ```

Note for developers:
Use the following commands in Powershell before restarting the application after changes, if your changes do not get reflected in the application after restart:
   ```bash
   Get-ChildItem -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
   Get-Process | Where-Object { $_.Name -like "*python*" } | Stop-Process -Force
   ```
