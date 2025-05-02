from base64 import b64encode
import sqlite3
import json
import os
from typing import Tuple, List, Optional
from functools import lru_cache
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
from fastapi.responses import FileResponse, RedirectResponse
import requests

app = FastAPI(title="WikiSpeedia API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

CLIENT_SECRET = os.getenv("HUGGINGFACE_CLIENT_SECRET")
IS_PROD = os.getenv("VITE_ENV") == "production"
print("CLIENT_SECRET:", CLIENT_SECRET)
print("IS_PROD:", IS_PROD)
class ArticleResponse(BaseModel):
    title: str
    links: List[str]


class HealthResponse(BaseModel):
    status: str
    article_count: int


class SQLiteDB:
    def __init__(self, db_path: str):
        """Initialize the database with path to SQLite database"""
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        self._article_count = self._get_article_count()
        print(f"Connected to SQLite database with {self._article_count} articles")

    def _get_article_count(self):
        self.cursor.execute("SELECT COUNT(*) FROM core_articles")
        return self.cursor.fetchone()[0]

    @lru_cache(maxsize=8192)
    def get_article_with_links(self, article_title: str) -> Tuple[str, List[str]]:
        self.cursor.execute(
            "SELECT title, links_json FROM core_articles WHERE title = ?",
            (article_title,),
        )
        article = self.cursor.fetchone()
        if not article:
            return None, []

        links = json.loads(article["links_json"])
        return article["title"], links

    def get_all_articles(self):
        self.cursor.execute("SELECT title FROM core_articles")
        return [row[0] for row in self.cursor.fetchall()]


# Initialize database connection
db = SQLiteDB(
    os.getenv("WIKISPEEDIA_DB_PATH", "/Users/jts/daily/wikihop/db/data/wikihop.db")
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint that returns the article count"""
    return HealthResponse(status="healthy", article_count=db._article_count)


@app.get("/get_all_articles", response_model=List[str])
async def get_all_articles():
    """Get all articles"""
    return db.get_all_articles()


@app.get("/get_article_with_links/{article_title}", response_model=ArticleResponse)
async def get_article(article_title: str):
    """Get article and its links by title"""
    title, links = db.get_article_with_links(article_title)
    if title is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return ArticleResponse(title=title, links=links)


@app.get("/auth/callback")
async def auth_callback(request: Request):

    OAUTH_API_BASE = "https://huggingface.co/oauth/token"
    CLIENT_ID = "a67ef241-fb7e-4300-a6bd-8430a7565c9a"

    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")

    response = requests.post(
        OAUTH_API_BASE,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {b64encode(f'{CLIENT_ID}:{CLIENT_SECRET}'.encode()).decode()}",
        },
        data={
            "client_id": CLIENT_ID,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": "http://localhost:8000/auth/callback" if not IS_PROD else "https://huggingfacetb-wikispeedia.hf.space/auth/callback",
        },
    )

    # response.json() =
    # {
    #     "access_token": "hf_oauth_eyJhbGciOiJFZERTQSJ9.eyJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIiwiZW1haWwiLCJpbmZlcmVuY2UtYXBpIl0sImF1ZCI6Imh0dHBzOi8vaHVnZ2luZ2ZhY2UuY28iLCJvYXV0aEFwcCI6ImE2N2VmMjQxLWZiN2UtNDMwMC1hNmJkLTg0MzBhNzU2NWM5YSIsInNlc3Npb25JZCI6IjY3YTBkYjk3OWNmZDQ3ZGFkOGNmNDMwNyIsImlhdCI6MTc0NjIxOTEwOCwic3ViIjoiNjE3OGQ4NDIyNjczMjBhYmI5OWRmNzc2IiwiZXhwIjoxNzQ2MjQ3OTA4LCJpc3MiOiJodHRwczovL2h1Z2dpbmdmYWNlLmNvIn0.TNK7Nb2X22LHlFqleo6rzJjBngjTWpVIksE1Mw7m8vVxgr7CBbK_a1J4cW488n02391qqopcaNlZKFP8noZSAA",
    #     "token_type": "bearer",
    #     "expires_in": 28799,
    #     "id_token": "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2MTc4ZDg0MjI2NzMyMGFiYjk5ZGY3NzYiLCJuYW1lIjoiSmFzb24gU3RpbGxlcm1hbiIsInByZWZlcnJlZF91c2VybmFtZSI6InN0aWxsZXJtYW4iLCJwcm9maWxlIjoiaHR0cHM6Ly9odWdnaW5nZmFjZS5jby9zdGlsbGVybWFuIiwicGljdHVyZSI6Imh0dHBzOi8vaHVnZ2luZ2ZhY2UuY28vYXZhdGFycy84NzM5NzA1ZWY3ZWFiYzk0NWExZWYzYzA3MTk2YWYxMy5zdmciLCJlbWFpbCI6Imphc29uLnQuc3RpbGxlcm1hbkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXVkIjoiYTY3ZWYyNDEtZmI3ZS00MzAwLWE2YmQtODQzMGE3NTY1YzlhIiwiYXV0aF90aW1lIjoxNzQ2MjE5MTA4LCJpYXQiOjE3NDYyMTkxMDgsImV4cCI6MTc0NjIyMjcwOCwiaXNzIjoiaHR0cHM6Ly9odWdnaW5nZmFjZS5jbyJ9.pB7j-jkxxMG3GJNzipMNCsKQimk8_R0TcPrwi-Kln6qXcSccwGcWJvyMZvFRHjKB779UkMTzgCO-eY1CINX75KaRALLS_Eu0w448F_5LMixwpBXA6dntXBEdP69VLXakpXaPHjFY2HuvUN7fbE8e2_v4a-s7RRwHTDJIcxyH2Bd_OUpebFy1N6RNB_9MIL3jxXhsXyLNL2uDry0WIB52BJKBXB4EzE12HDGgNaWR6lrqr4nvjAExsGcTwarPhFSA5ndcbgh82vJxB3rVFhSU4iZ5AmMV1mDX6SgRVdPmWZPgTBwGeGlVN-OAHvLlNJ9FZ_i0qjrtA5IRU0o6ctKrfw",
    #     "scope": "openid profile email inference-api",
    #     "refresh_token": "hf_oauth__refresh_RiVshOppmioFVoxvYMXSPkMdyyzbyIqadj",
    # }

    print(response.json())

    # redirect to the home page with access token and id token in the url
    return RedirectResponse(url=f"/?access_token={response.json()['access_token']}&id_token={response.json()['id_token']}")

    """Auth callback endpoint"""
    return {"message": "Auth callback received"}


# Mount the dist folder for static files
app.mount("/", StaticFiles(directory="dist", html=True), name="static")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
