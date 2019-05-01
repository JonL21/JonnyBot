const { apikey } = require('../config.json');
const { google } = require('googleapis');

module.exports = {
	getVideo: query => {
		return new Promise((resolve, reject) => {
			const service = google.youtube('v3');
			service.search.list({
				auth: apikey,
				part: 'id,snippet',
				type: 'video',
				q: query,
			}, (err, response) => {
				if (err) reject(`The API returned an error: ${err}`);
				if (response.data.items.length == 0) {
					reject('No video found.');
				}
				else {
					const videos = [];
					for (let i = 0; i < response.data.items.length; i++) {
						const video = {
							title: response.data.items[i].snippet.title,
							url: `https://www.youtube.com/watch?v=${response.data.items[i].id.videoId}`,
							thumbnail: response.data.items[i].snippet.thumbnails.high.url,
							description: response.data.items[i].snippet.description,
							publishedDate: response.data.items[i].snippet.publishedAt,
							channelTitle: response.data.items[i].snippet.channelTitle,
						};
						videos.push(video);
					}
					resolve(videos);
				}
			});
		});
	},
};