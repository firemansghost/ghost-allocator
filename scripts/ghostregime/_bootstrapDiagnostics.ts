/**
 * Bootstrap for CLI Diagnostic Scripts
 * 
 * Sets runtime environment flags to ensure CLI diagnostics use local persistence
 * and don't require blob storage tokens.
 * 
 * Import this at the top of any diagnostic/parity CLI script.
 */

// Set CLI runtime flag (checked by persistence adapter)
// This ensures getStorageAdapter() uses LocalFileAdapter instead of requiring blob token
if (!process.env.GHOSTREGIME_RUNTIME) {
  process.env.GHOSTREGIME_RUNTIME = 'cli';
}
