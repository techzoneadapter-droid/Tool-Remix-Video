use std::{fs, path::PathBuf, sync::Mutex};

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

pub struct AppDatabase {
    connection: Mutex<Connection>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectHistoryRecord {
    pub id: String,
    pub name: String,
    pub mode: String,
    pub aspect: String,
    pub duration: String,
    pub date: String,
    pub status: String,
    pub thumbnail: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettingRecord {
    pub key: String,
    pub value: serde_json::Value,
    pub updated_at: String,
}

impl AppDatabase {
    pub fn initialize(app: &AppHandle) -> Result<Self, String> {
        let db_path = database_path(app)?;
        let connection = Connection::open(db_path).map_err(|error| error.to_string())?;
        run_migrations(&connection)?;

        Ok(Self {
            connection: Mutex::new(connection),
        })
    }

    fn with_connection<T>(&self, action: impl FnOnce(&Connection) -> Result<T, String>) -> Result<T, String> {
        let connection = self.connection.lock().map_err(|_| "Database connection lock failed.".to_string())?;
        action(&connection)
    }
}

fn database_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
    fs::create_dir_all(&app_data_dir).map_err(|error| error.to_string())?;
    Ok(app_data_dir.join("remixai-pro.sqlite3"))
}

fn run_migrations(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS project_history (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              mode TEXT NOT NULL,
              aspect TEXT NOT NULL,
              duration TEXT NOT NULL,
              date TEXT NOT NULL,
              status TEXT NOT NULL,
              thumbnail TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS app_settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            ",
        )
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_project_history(database: tauri::State<'_, AppDatabase>, record: ProjectHistoryRecord) -> Result<(), String> {
    database.with_connection(|connection| {
        connection
            .execute(
                "
                INSERT INTO project_history (id, name, mode, aspect, duration, date, status, thumbnail, updated_at)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, CURRENT_TIMESTAMP)
                ON CONFLICT(id) DO UPDATE SET
                  name = excluded.name,
                  mode = excluded.mode,
                  aspect = excluded.aspect,
                  duration = excluded.duration,
                  date = excluded.date,
                  status = excluded.status,
                  thumbnail = excluded.thumbnail,
                  updated_at = CURRENT_TIMESTAMP
                ",
                params![
                    record.id,
                    record.name,
                    record.mode,
                    record.aspect,
                    record.duration,
                    record.date,
                    record.status,
                    record.thumbnail
                ],
            )
            .map_err(|error| error.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn list_project_history(database: tauri::State<'_, AppDatabase>, limit: Option<u32>) -> Result<Vec<ProjectHistoryRecord>, String> {
    database.with_connection(|connection| {
        let mut statement = connection
            .prepare(
                "
                SELECT id, name, mode, aspect, duration, date, status, thumbnail
                FROM project_history
                ORDER BY datetime(updated_at) DESC
                LIMIT ?1
                ",
            )
            .map_err(|error| error.to_string())?;
        let rows = statement
            .query_map(params![limit.unwrap_or(50)], |row| {
                Ok(ProjectHistoryRecord {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    mode: row.get(2)?,
                    aspect: row.get(3)?,
                    duration: row.get(4)?,
                    date: row.get(5)?,
                    status: row.get(6)?,
                    thumbnail: row.get(7)?,
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
    })
}

#[tauri::command]
pub fn save_app_setting(database: tauri::State<'_, AppDatabase>, record: AppSettingRecord) -> Result<(), String> {
    database.with_connection(|connection| {
        connection
            .execute(
                "
                INSERT INTO app_settings (key, value, updated_at)
                VALUES (?1, ?2, ?3)
                ON CONFLICT(key) DO UPDATE SET
                  value = excluded.value,
                  updated_at = excluded.updated_at
                ",
                params![record.key, record.value.to_string(), record.updated_at],
            )
            .map_err(|error| error.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn list_app_settings(database: tauri::State<'_, AppDatabase>) -> Result<Vec<AppSettingRecord>, String> {
    database.with_connection(|connection| {
        let mut statement = connection
            .prepare("SELECT key, value, updated_at FROM app_settings ORDER BY key ASC")
            .map_err(|error| error.to_string())?;
        let rows = statement
            .query_map([], |row| {
                let raw_value: String = row.get(1)?;
                Ok(AppSettingRecord {
                    key: row.get(0)?,
                    value: serde_json::from_str(&raw_value).unwrap_or(serde_json::Value::Null),
                    updated_at: row.get(2)?,
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
    })
}
