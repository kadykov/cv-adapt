import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cv_adapter.core.async_application import AsyncCVAdapterApplication

from .logger import setup_logging_middleware
from .api import auth, users, cvs, jobs, generations

# Only import test router if we're in a test environment
if os.environ.get("TESTING") == "1":
    from .api import test

app = FastAPI(title="CV Adapter Web Interface")

# Setup logging middleware first
setup_logging_middleware(app)

# Configure CORS with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Allow both localhost variants
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods during development
    allow_headers=["*"],  # Allow all headers during development
    expose_headers=["X-Request-ID", "*"],  # Expose request ID and other headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers from api modules
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(cvs.router)
app.include_router(jobs.router)
app.include_router(generations.router)

# Include test router only in test environment
if os.environ.get("TESTING") == "1":
    app.include_router(test.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
