'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');
const { DateTime } = require("luxon");

class OctoprintAPI {
	constructor(options) {
		if (options === null) {
			options = {}
		}

		this.address = options.address;
		if (!/^(?:f|ht)tps?\:\/\//.test(options.address)) {
			this.address = "http://" + options.address;
		}

		this.apikey = options.apikey;
	}

	async getServerState() {
		let result = null;

		await this.getData('/api/server')
		.then(res => {
			if (res.version !== undefined) {
				result = res.version;
			}
		})
		.catch(error => {
			console.error(error)
		});

		return result;
	}

	async getPrinterState() {
		let result = null;

		await this.getData('/api/connection')
		.then(res => {
			if (
				res.current.state !== undefined
				&& typeof res.current.state === 'string'
			) {
				result = res.current.state;
			}
		})
		.catch(error => {
			console.error(error)
		});

		return result;
	}

	async isPrinting() {
		let result = false;

		await this.getData('/api/connection')
		.then(res => {
			if (
				res.current.state !== undefined
				&& res.current.state === 'Printing'
			) {
				result = true;
			}
		})
		.catch(error => {
			console.error(error);
		});

		return result;
	}

	async getPrinterJob(tz) {
		let result = {};

		await this.getData('/api/job')
		.then(res => {
			result = {
				file: (res.job.file.name !== undefined && typeof res.job.file.name === 'string') ? res.job.file.name : null,
				completion: (res.progress.completion !== undefined && typeof res.progress.completion === 'number') ? Math.round(res.progress.completion * 10) / 10 : 0,
				completion_time_calculated: (res.progress.printTime !== undefined && typeof res.progress.printTime === 'number' && res.progress.printTimeLeft !== undefined && typeof res.progress.printTimeLeft === 'number') ? Math.round((res.progress.printTime / (res.progress.printTime + res.progress.printTimeLeft)) * 1000) / 10 : 0,
				estimate: (res.job.estimatedPrintTime === undefined || typeof res.job.estimatedPrintTime !== 'number') ? null : (res.job.estimatedPrintTime >= 86400) ? DateTime.fromSeconds(res.job.estimatedPrintTime).minus({ days: 1 }).toFormat("d'd' H'h' m'm' s's'") : DateTime.fromSeconds(res.job.estimatedPrintTime).toFormat("H'h' m'm' s's'"),
				estimate_hms: (res.job.estimatedPrintTime === undefined || typeof res.job.estimatedPrintTime !== 'number') ? null : (res.job.estimatedPrintTime >= 86400) ? DateTime.fromSeconds(res.job.estimatedPrintTime).minus({ days: 1 }).toFormat("d'd' HH:mm:ss") : DateTime.fromSeconds(res.job.estimatedPrintTime).toFormat('HH:mm:ss'),
				estimate_seconds: (res.job.estimatedPrintTime !== undefined && typeof res.job.estimatedPrintTime === 'number') ? Math.round(res.job.estimatedPrintTime) : null,
				estimate_end_time: (res.progress.printTimeLeft !== undefined && typeof res.progress.printTimeLeft === 'number') ? DateTime.now().setZone(tz).plus({ seconds: res.progress.printTimeLeft }).toFormat('d MMM HH:mm:ss') : (res.job.estimatedPrintTime !== undefined && typeof res.job.estimatedPrintTime === 'number') ? DateTime.now().setZone(tz).plus({ seconds: res.job.estimatedPrintTime }).toFormat('d MMM HH:mm:ss') : null,
				estimate_end_time_short: (res.progress.printTimeLeft !== undefined && typeof res.progress.printTimeLeft === 'number') ? DateTime.now().setZone(tz).plus({ seconds: res.progress.printTimeLeft }).toFormat('d/M HH:mm') : (res.job.estimatedPrintTime !== undefined && typeof res.job.estimatedPrintTime === 'number') ? DateTime.now().setZone(tz).plus({ seconds: res.job.estimatedPrintTime }).toFormat('d/M HH:mm') : null,
				estimate_end_time_full: (res.progress.printTimeLeft !== undefined && typeof res.progress.printTimeLeft === 'number') ? DateTime.now().setZone(tz).plus({ seconds: res.progress.printTimeLeft }).toFormat('d MMMM HH:mm:ss') : (res.job.estimatedPrintTime !== undefined && typeof res.job.estimatedPrintTime === 'number') ? DateTime.now().setZone(tz).plus({ seconds: res.job.estimatedPrintTime }).toFormat('d MMMM HH:mm:ss') : null,
				time: (res.progress.printTime === undefined || typeof res.progress.printTime !== 'number') ? null : (res.progress.printTime >= 86400) ? DateTime.fromSeconds(res.progress.printTime).minus({ days: 1 }).toFormat("d'd' H'h' m'm' s's'") : DateTime.fromSeconds(res.progress.printTime).toFormat("H'h' m'm' s's'"),
				time_hms: (res.progress.printTime === undefined || typeof res.progress.printTime !== 'number') ? null : (res.progress.printTime >= 86400) ? DateTime.fromSeconds(res.progress.printTime).minus({ days: 1 }).toFormat("d'd' HH:mm:ss") : DateTime.fromSeconds(res.progress.printTime).toFormat('HH:mm:ss'),
				time_seconds: (res.progress.printTime !== undefined && typeof res.progress.printTime === 'number') ? res.progress.printTime : null,
				left: (res.progress.printTimeLeft === undefined || typeof res.progress.printTimeLeft !== 'number') ? null : (res.progress.printTimeLeft >= 86400) ? DateTime.fromSeconds(res.progress.printTimeLeft).minus({ days: 1 }).toFormat("d'd' H'h' m'm' s's'") : DateTime.fromSeconds(res.progress.printTimeLeft).toFormat("H'h' m'm' s's'"),
				left_hms: (res.progress.printTimeLeft === undefined || typeof res.progress.printTimeLeft !== 'number') ? null : (res.progress.printTimeLeft >= 86400) ? DateTime.fromSeconds(res.progress.printTimeLeft).minus({ days: 1 }).toFormat("d'd' HH:mm:ss") : DateTime.fromSeconds(res.progress.printTimeLeft).toFormat('HH:mm:ss'),
				seconds_left: (res.progress.printTimeLeft !== undefined && typeof res.progress.printTimeLeft === 'number') ? res.progress.printTimeLeft : null,
				error: (res.error !== undefined && typeof res.error === 'string') ? res.error : null
			};
		})
		.catch(error => {
			console.error(error);
		});

		return result;
	}

	async getPrinterTemps() {
		let result = {};

		await this.getData('/api/printer')
		.then(res => {
			if (res.temperature !== undefined) {
				result = {
					bed: {
						actual: null,
						target: null
					},
					tool0: {
						actual: null,
						target: null
					},
					chamber: {
						actual: null,
						target: null
					}
				};

				if (res.temperature.bed !== undefined) {
					result.bed = {
						actual: (res.temperature.bed.actual !== undefined && typeof res.temperature.bed.actual === 'number') ? res.temperature.bed.actual : null,
						target: (res.temperature.bed.target !== undefined && typeof res.temperature.bed.target === 'number') ? res.temperature.bed.target : null
					}
				}

				if (res.temperature.tool0 !== undefined) {
					result.tool0 = {
						actual: (res.temperature.tool0.actual !== undefined && typeof res.temperature.tool0.actual === 'number') ? res.temperature.tool0.actual : null,
						target: (res.temperature.tool0.target !== undefined && typeof res.temperature.tool0.target === 'number') ? res.temperature.tool0.target : null
					}
				}

				if (res.temperature.chamber !== undefined) {
					result.chamber = {
						actual: (res.temperature.chamber.actual !== undefined && typeof res.temperature.chamber.actual === 'number') ? res.temperature.chamber.actual : null,
						target: (res.temperature.chamber.target !== undefined && typeof res.temperature.chamber.target === 'number') ? res.temperature.chamber.target : null
					}
				}
			}
		})
		.catch(error => {
			console.error(error);
		});

		return result;
	}

	async postData(path, data) {
		const endpoint = this.address + path;
		const options = {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.apikey
			}
		}

		fetch(endpoint, options)
		.then(res => res.json())
		.then(json => {
			return json;
		})
		.catch(error => {
			return error;
		});
	}

	async getData(path) {
		const endpoint = this.address + path;
		const options = {
			headers: {
				'Authorization': 'Bearer ' + this.apikey
			}
		}
		return new Promise((resolve, reject) => {
			fetch(endpoint, options)
			.then(res => {
				if (res.status === 200) {
					return res.json();
				}
				return false;
			})
			.then(json => {
				return resolve(json);
			})
			.catch(error => {
				return reject(error);
			});
		});
	}

	getWebcamUrl(endpoint, defaultPath) {
		const fallbackUrl = new URL(defaultPath, `${this.address}/`).toString();

		if (typeof endpoint !== 'string' || endpoint.trim() === '') {
			return fallbackUrl;
		}

		const value = endpoint.replace(/[\r\n\t]/g, '').trim();

		if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
			return value;
		}

		if (value.startsWith('//')) {
			return `http:${value}`;
		}

		if (value.startsWith('/') || value.startsWith('?')) {
			return new URL(value, `${this.address}/`).toString();
		}

		if (/^[a-z0-9.-]+(?::\d+)?\/.+$/i.test(value)) {
			return `http://${value}`;
		}

		try {
			return new URL(`/${value}`, `${this.address}/`).toString();
		}
		catch (error) {
			return fallbackUrl;
		}
	}

	async getSnapshot(endpoint) {
		const address = this.getWebcamUrl(endpoint, '/webcam/?action=snapshot');
		const fallbackAddress = this.getWebcamUrl('', '/webcam/?action=snapshot');
		const res = await fetch(address);

		if (
			!res.ok
			&& address !== fallbackAddress
		) {
			return await fetch(fallbackAddress);
		}

		return res;
	}

	getStreamUrl(endpoint) {
		return this.getWebcamUrl(endpoint, '/webcam/?action=stream');
	}

	async getCameraStreamerStatus() {
		const endpoint = this.getWebcamUrl('/webcam/status', '/webcam/status');
		const res = await fetch(endpoint);
		if (!res.ok) {
			throw new Error(`camera-streamer status failed (${res.status})`);
		}

		return await res.json();
	}

	async getWebRtcAnswer(endpoint, offerSdp) {
		const address = this.getWebcamUrl(endpoint, '/webcam/webrtc');
		const offerCandidateCount = typeof offerSdp === 'string'
			? (offerSdp.match(/^a=candidate:/gm) || []).length
			: 0;
		const offerHasH264 = typeof offerSdp === 'string' && /H264/i.test(offerSdp);
		console.log('[OctoPrint] Sending WebRTC offer to camera-streamer', {
			address,
			offerLength: typeof offerSdp === 'string' ? offerSdp.length : 0,
			offerCandidateCount,
			offerHasH264,
		});
		const res = await fetch(address, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				type: 'offer',
				sdp: offerSdp,
				keepAlive: false,
			})
		});

		let payload = {};
		let responseText = '';
		try {
			responseText = await res.text();
			payload = responseText ? JSON.parse(responseText) : {};
		}
		catch (error) {
			payload = {};
		}

		if (!res.ok || typeof payload.sdp !== 'string') {
			const reason = (payload && typeof payload.error === 'string')
				? payload.error
				: (responseText || `HTTP ${res.status}`);
			console.log('[OctoPrint] WebRTC signaling failed', {
				status: res.status,
				reason,
			});
			throw new Error(`WebRTC signaling failed: ${reason}`);
		}

		const answerCandidateIps = [];
		const answerConnectionIps = [];
		for (const line of payload.sdp.split('\n')) {
			const trimmed = line.trim();
			if (trimmed.startsWith('a=candidate:')) {
				const parts = trimmed.split(/\s+/);
				if (parts.length >= 6) {
					answerCandidateIps.push(parts[4]);
				}
			}
			if (trimmed.startsWith('c=')) {
				const parts = trimmed.split(/\s+/);
				if (parts.length >= 3) {
					answerConnectionIps.push(parts[2]);
				}
			}
		}

		console.log('[OctoPrint] WebRTC answer received', {
			status: res.status,
			answerLength: payload.sdp.length,
			streamId: payload.id || null,
			answerCandidateCount: (payload.sdp.match(/^a=candidate:/gm) || []).length,
			answerHasH264: /H264/i.test(payload.sdp),
			answerCandidateIps: [...new Set(answerCandidateIps)],
			answerConnectionIps: [...new Set(answerConnectionIps)],
		});
		return {
			answerSdp: payload.sdp,
			streamId: payload.id,
		};
	}
}

module.exports = { OctoprintAPI };
