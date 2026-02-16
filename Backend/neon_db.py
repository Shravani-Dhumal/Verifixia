import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class NeonDB:
    def __init__(self):
        self.database_url = os.getenv("NETLIFY_DATABASE_URL") or os.getenv("DATABASE_URL")
        if not self.database_url:
            logger.warning("No database URL configured. Database operations will fail.")
            self.pool = None
        else:
            try:
                self.pool = SimpleConnectionPool(1, 5, self.database_url)
            except Exception as e:
                logger.error(f"Failed to create connection pool: {e}")
                self.pool = None

    def get_connection(self):
        if not self.pool:
            raise Exception("Database connection pool not initialized")
        return self.pool.getconn()

    def return_connection(self, conn):
        if self.pool:
            self.pool.putconn(conn)

    def execute_query(self, query, params=None):
        """Execute a single query and return results"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params or ())
            return cursor.fetchall()
        finally:
            cursor.close()
            self.return_connection(conn)

    def execute_update(self, query, params=None):
        """Execute an INSERT, UPDATE, or DELETE query"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            conn.commit()
            return cursor.rowcount
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            cursor.close()
            self.return_connection(conn)

    def execute_query_single(self, query, params=None):
        """Execute a query and return a single row"""
        results = self.execute_query(query, params)
        return results[0] if results else None

    def create_tables(self):
        """Initialize database tables"""
        create_users_table = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """

        create_detection_logs_table = """
        CREATE TABLE IF NOT EXISTS detection_logs (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            prediction VARCHAR(10) NOT NULL,
            confidence FLOAT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER REFERENCES users(id),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        """

        create_index = """
        CREATE INDEX IF NOT EXISTS idx_detection_logs_timestamp ON detection_logs(timestamp);
        """

        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(create_users_table)
            cursor.execute(create_detection_logs_table)
            cursor.execute(create_index)
            conn.commit()
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            conn.rollback()
        finally:
            cursor.close()
            self.return_connection(conn)

    def get_detection_logs(self, limit=100, offset=0):
        """Retrieve detection logs"""
        query = """
        SELECT * FROM detection_logs 
        ORDER BY timestamp DESC 
        LIMIT %s OFFSET %s;
        """
        return self.execute_query(query, (limit, offset))

    def save_detection_log(self, filename, prediction, confidence, user_id=None):
        """Save a detection log to the database"""
        query = """
        INSERT INTO detection_logs (filename, prediction, confidence, user_id)
        VALUES (%s, %s, %s, %s)
        RETURNING id, timestamp;
        """
        result = self.execute_query_single(query, (filename, prediction, confidence, user_id))
        return result

    def close(self):
        """Close all database connections"""
        if self.pool:
            self.pool.closeall()

# Initialize database connection
db = NeonDB()
