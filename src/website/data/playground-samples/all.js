(function () {
	var PLAY_SAMPLES = [
		{
			chapter: "Helios",
			name: "Hello world!",
			id: "helios-hello-world",
			path: "helios/hello-world",
		},
		{
			chapter: "Helios",
			name: "Time lock",
			id: "time-lock-hello-world",
			path: "helios/time-lock",
		},
		{
			chapter: "Helios",
			name: "Magic number",
			id: "magic-number-hello-world",
			path: "helios/magic-number",
		},
	];

	if (typeof exports !== "undefined") {
		exports.PLAY_SAMPLES = PLAY_SAMPLES;
	} else {
		self.PLAY_SAMPLES = PLAY_SAMPLES;
	}
})();
