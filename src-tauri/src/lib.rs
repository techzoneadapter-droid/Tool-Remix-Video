mod ai_gateway;
mod database;
mod export;
mod secret_store;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let database = database::AppDatabase::initialize(app.handle())?;
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            database::save_project_history,
            database::list_project_history,
            database::save_app_setting,
            database::list_app_settings,
            export::check_ffmpeg_health,
            export::run_ffmpeg_export,
            ai_gateway::ai_gateway_health,
            ai_gateway::ai_gateway_request,
            secret_store::list_ai_secret_status,
            secret_store::save_ai_secret,
            secret_store::delete_ai_secret
        ])
        .run(tauri::generate_context!())
        .expect("error while running RemixAI Pro");
}
