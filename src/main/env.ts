import { app } from "electron"

export const outputDirectory = process.env.PORTABLE_EXECUTABLE_DIR || app.getAppPath()