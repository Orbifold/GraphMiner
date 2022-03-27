/*
 * Global logger which dispatches things to Azure AppInsights.
 * See https://github.com/microsoft/ApplicationInsights-JS/blob/master/API-reference.md
 * */
import { DebugCategory } from "@/shared/debugCategory";

export default class Logger {
	public static $appInsights;

	static onTrace(msg) {
		if (Logger.$appInsights) {
			Logger.$appInsights.trackTrace({ message: msg });
		}
	}

	static onError(error) {
		if (Logger.$appInsights) {
			Logger.$appInsights.trackException({ exception: error, severityLevel: 3 });
		}
	}

	static onWarn(msg) {
		if (Logger.$appInsights) {
			Logger.$appInsights.trackTrace({ message: msg });
		}
	}

	/**
	 * Trace messages are sent to AppInsights, while debug and log are only for the browser.
	 * @param msg {string} The message to keep.
	 */
	static trace(msg: string) {
		Logger.onTrace(msg);
		console.log(msg);
	}

	/**
	 * Corresponds to {@link debug} with category {@link DebugCategory.info}.
	 * @param msg {string} The message to log.
	 */
	static log(msg: string) {
		Logger.debug(msg);
	}

	static debug(msg: string, category: DebugCategory = DebugCategory.info) {
		switch (category) {
			case DebugCategory.info:
				if (process.env.VUE_APP_INFO_MESSAGES === "true") {
					console.log(msg);
				}
				break;
			case DebugCategory.collaboration:
				if (process.env.VUE_APP_COLLABORATION_MESSAGES === "true") {
					console.log(msg);
				}
				break;
		}
	}

	static error(msg: string) {
		const error = new Error(msg);
		Logger.onError(error);
		throw error;
	}

	static warn(msg: string) {
		Logger.onWarn(msg);
		console.warn(msg);
	}
}
