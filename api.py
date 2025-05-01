import sqlite3
import json
import os
from typing import Tuple, List, Optional
from functools import lru_cache
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="WikiSpeedia API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

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

# Initialize database connection
db = SQLiteDB(
    os.getenv("WIKISPEEDIA_DB_PATH", "/Users/jts/daily/wikihop/db/data/wikihop.db")
)

@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint that returns the article count"""
    return HealthResponse(
        status="healthy",
        article_count=db._article_count
    )

@app.get("/get_article_with_links/{article_title}", response_model=ArticleResponse)
async def get_article(article_title: str):
    """Get article and its links by title"""
    title, links = db.get_article_with_links(article_title)
    if title is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return ArticleResponse(title=title, links=links)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)