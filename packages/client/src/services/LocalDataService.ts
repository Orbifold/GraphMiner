import * as _ from "lodash";


export interface IAppSettings {
}

export default class LocalDataService {
	appDataPrefix: string;
	userPrefix: string;

	constructor() {
		this.appDataPrefix = "_cc_settings_";
		this.userPrefix = "_cc_user_";
	}


	//region App settings
	appSettingsExist(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			for (let i = 0; i < localStorage.length; i++) {
				if (this.isAppKey(localStorage.key(i))) {
					return resolve(true);
				}
			}
			return resolve(false);
		});
	}

	updateAppSettings(json): Promise<boolean> {
		return new Promise(async (resolve, reject) => {
			let settings = await this.getAppSettings();
			settings = _.assign(settings, json);
			resolve(this._save(this.appKey, settings));
		});
	}

	getAppSettings(): Promise<IAppSettings> {
		return new Promise(async (resolve, reject) => {
			if (await this.appSettingsExist()) {
				const raw = localStorage.getItem(this.appKey);
				resolve(JSON.parse(raw) as IAppSettings);
			} else {
				const settings: IAppSettings = {
					activeProjectId: "sample",
				};
				this._save(this.appKey, settings);
				resolve(settings);
			}
		});
	}

	//endregion

	private get appKey() {
		return this.appDataPrefix;
	}

	private get userKey() {
		return this.userPrefix;
	}

	private isAppKey(s) {
		return s === this.appDataPrefix;
	}

	private isUserKey(s) {
		return s === this.userPrefix;
	}

	/**
	 * Save whatever to the local data storage.
	 * @param name
	 * @param data {any} Can be diverse data types.
	 * @returns {boolean}
	 * @private
	 */
	private _save(name, data): boolean {
		let dataString;
		if (_.isPlainObject(data)) {
			dataString = JSON.stringify(data);
		} else if (_.isString(data)) {
			dataString = data;
		} else if (_.isDate(data)) {
			dataString = (data as Date).getTime().toString();
		} else {
			throw new Error(`Not sure how to serialize data type '${typeof data}'.`);
		}

		localStorage.setItem(name, dataString);
		return true;
	}
}
