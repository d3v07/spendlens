"""
Database connection and utilities for Supabase Postgres
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional
from contextlib import contextmanager

class Database:
    def __init__(self):
        # Supabase connection string format
        # postgres://postgres:[PASSWORD]@[PROJECT_ID].supabase.co:5432/postgres
        self.conn_string = os.getenv('DATABASE_URL')
        if not self.conn_string:
            raise ValueError("DATABASE_URL environment variable is required")
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            conn = psycopg2.connect(self.conn_string)
            yield conn
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()
    
    def execute_query(self, query: str, params: Optional[tuple] = None, fetch: bool = False):
        """Execute a query and optionally fetch results"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                if fetch:
                    return cursor.fetchall()
                return cursor.rowcount
    
    def execute_many(self, query: str, params_list: list):
        """Execute same query multiple times with different parameters"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.executemany(query, params_list)
                return cursor.rowcount
