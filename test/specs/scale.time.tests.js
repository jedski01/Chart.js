// Time scale tests
describe('Time scale tests', function() {
	function createScale(data, options) {
		var scaleID = 'myScale';
		var mockContext = window.createMockContext();
		var Constructor = Chart.scaleService.getScaleConstructor('time');
		var scale = new Constructor({
			ctx: mockContext,
			options: options,
			chart: {
				data: data
			},
			id: scaleID
		});

		scale.update(400, 50);
		return scale;
	}

	function getTicksValues(ticks) {
		return ticks.map(function(tick) {
			return tick.value;
		});
	}

	beforeEach(function() {
		// Need a time matcher for getValueFromPixel
		jasmine.addMatchers({
			toBeCloseToTime: function() {
				return {
					compare: function(actual, expected) {
						var result = false;

						var diff = actual.diff(expected.value, expected.unit, true);
						result = Math.abs(diff) < (expected.threshold !== undefined ? expected.threshold : 0.01);

						return {
							pass: result
						};
					}
				};
			}
		});
	});

	it('Should load moment.js as a dependency', function() {
		expect(window.moment).not.toBe(undefined);
	});

	it('Should register the constructor with the scale service', function() {
		var Constructor = Chart.scaleService.getScaleConstructor('time');
		expect(Constructor).not.toBe(undefined);
		expect(typeof Constructor).toBe('function');
	});

	it('Should have the correct default config', function() {
		var defaultConfig = Chart.scaleService.getScaleDefaults('time');
		expect(defaultConfig).toEqual({
			display: true,
			gridLines: {
				color: 'rgba(0, 0, 0, 0.1)',
				drawBorder: true,
				drawOnChartArea: true,
				drawTicks: true,
				tickMarkLength: 10,
				lineWidth: 1,
				offsetGridLines: false,
				display: true,
				zeroLineColor: 'rgba(0,0,0,0.25)',
				zeroLineWidth: 1,
				zeroLineBorderDash: [],
				zeroLineBorderDashOffset: 0.0,
				borderDash: [],
				borderDashOffset: 0.0
			},
			position: 'bottom',
			scaleLabel: {
				labelString: '',
				display: false
			},
			ticks: {
				beginAtZero: false,
				minRotation: 0,
				maxRotation: 50,
				mirror: false,
				padding: 0,
				reverse: false,
				display: true,
				callback: defaultConfig.ticks.callback, // make this nicer, then check explicitly below,
				autoSkip: false,
				autoSkipPadding: 0,
				labelOffset: 0,
				minor: {},
				major: {},
			},
			time: {
				parser: false,
				format: false,
				unit: false,
				round: false,
				isoWeekday: false,
				displayFormat: false,
				minUnit: 'millisecond',
				displayFormats: {
					millisecond: 'h:mm:ss.SSS a', // 11:20:01.123 AM
					second: 'h:mm:ss a', // 11:20:01 AM
					minute: 'h:mm a', // 11:20 AM
					hour: 'hA', // 5PM
					day: 'MMM D', // Sep 4
					week: 'll', // Week 46, or maybe "[W]WW - YYYY" ?
					month: 'MMM YYYY', // Sept 2015
					quarter: '[Q]Q - YYYY', // Q3
					year: 'YYYY' // 2015
				},
			}
		});

		// Is this actually a function
		expect(defaultConfig.ticks.callback).toEqual(jasmine.any(Function));
	});

	describe('when given inputs of different types', function() {
		// Helper to build date objects
		function newDateFromRef(days) {
			return moment('01/01/2015 12:00', 'DD/MM/YYYY HH:mm').add(days, 'd').toDate();
		}

		it('should accept labels as strings', function() {
			var mockData = {
				labels: ['2015-01-01T12:00:00', '2015-01-02T21:00:00', '2015-01-03T22:00:00', '2015-01-05T23:00:00', '2015-01-07T03:00', '2015-01-08T10:00', '2015-01-10T12:00'], // days
			};

			var scaleOptions = Chart.scaleService.getScaleDefaults('time');
			var scale = createScale(mockData, scaleOptions);
			scale.update(1000, 200);
			var ticks = getTicksValues(scale.ticks);

			expect(ticks).toEqual(['Jan 2015', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11']);
		});

		it('should accept labels as date objects', function() {
			var mockData = {
				labels: [newDateFromRef(0), newDateFromRef(1), newDateFromRef(2), newDateFromRef(4), newDateFromRef(6), newDateFromRef(7), newDateFromRef(9)], // days
			};
			var scale = createScale(mockData, Chart.scaleService.getScaleDefaults('time'));
			scale.update(1000, 200);
			var ticks = getTicksValues(scale.ticks);

			expect(ticks).toEqual(['Jan 2015', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11']);
		});

		it('should accept data as xy points', function() {
			var chart = window.acquireChart({
				type: 'line',
				data: {
					datasets: [{
						xAxisID: 'xScale0',
						data: [{
							x: newDateFromRef(0),
							y: 1
						}, {
							x: newDateFromRef(1),
							y: 10
						}, {
							x: newDateFromRef(2),
							y: 0
						}, {
							x: newDateFromRef(4),
							y: 5
						}, {
							x: newDateFromRef(6),
							y: 77
						}, {
							x: newDateFromRef(7),
							y: 9
						}, {
							x: newDateFromRef(9),
							y: 5
						}]
					}],
				},
				options: {
					scales: {
						xAxes: [{
							id: 'xScale0',
							type: 'time',
							position: 'bottom'
						}],
					}
				}
			});

			var xScale = chart.scales.xScale0;
			xScale.update(800, 200);
			var ticks = getTicksValues(xScale.ticks);

			expect(ticks).toEqual(['Jan 2015', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11']);
		});
	});

	it('should allow custom time parsers', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					data: [{
						x: 375068900,
						y: 1
					}]
				}],
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'time',
						position: 'bottom',
						time: {
							unit: 'day',
							round: true,
							parser: function(label) {
								return moment.unix(label);
							}
						}
					}],
				}
			}
		});

		// Counts down because the lines are drawn top to bottom
		var xScale = chart.scales.xScale0;

		// Counts down because the lines are drawn top to bottom
		expect(xScale.ticks[0].value).toEqualOneOf(['Nov 19', 'Nov 20', 'Nov 21']); // handle time zone changes
		expect(xScale.ticks[1].value).toEqualOneOf(['Nov 19', 'Nov 20', 'Nov 21']); // handle time zone changes
	});

	it('should build ticks using the config unit', function() {
		var mockData = {
			labels: ['2015-01-01T20:00:00', '2015-01-02T21:00:00'], // days
		};

		var config = Chart.helpers.clone(Chart.scaleService.getScaleDefaults('time'));
		config.time.unit = 'hour';

		var scale = createScale(mockData, config);
		scale.update(2500, 200);
		var ticks = getTicksValues(scale.ticks);

		expect(ticks).toEqual(['8PM', '9PM', '10PM', '11PM', 'Jan 2', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM']);
	});

	it('build ticks honoring the minUnit', function() {
		var mockData = {
			labels: ['2015-01-01T20:00:00', '2015-01-02T21:00:00'], // days
		};

		var config = Chart.helpers.clone(Chart.scaleService.getScaleDefaults('time'));
		config.time.minUnit = 'day';

		var scale = createScale(mockData, config);
		var ticks = getTicksValues(scale.ticks);

		expect(ticks).toEqual(['Jan 2015', 'Jan 2', 'Jan 3']);
	});

	it('should build ticks using the config diff', function() {
		var mockData = {
			labels: ['2015-01-01T20:00:00', '2015-02-02T21:00:00', '2015-02-21T01:00:00'], // days
		};

		var config = Chart.helpers.clone(Chart.scaleService.getScaleDefaults('time'));
		config.time.unit = 'week';
		config.time.round = 'week';

		var scale = createScale(mockData, config);
		scale.update(800, 200);
		var ticks = getTicksValues(scale.ticks);

		// last date is feb 15 because we round to start of week
		expect(ticks).toEqual(['Dec 28, 2014', 'Jan 4, 2015', 'Jan 11, 2015', 'Jan 18, 2015', 'Jan 25, 2015', 'Feb 2015', 'Feb 8, 2015', 'Feb 15, 2015']);
	});

	describe('when specifying limits', function() {
		var mockData = {
			labels: ['2015-01-01T20:00:00', '2015-01-02T20:00:00', '2015-01-03T20:00:00'],
		};

		var config;
		beforeEach(function() {
			config = Chart.helpers.clone(Chart.scaleService.getScaleDefaults('time'));
		});

		it('should use the min option', function() {
			config.time.unit = 'day';
			config.time.min = '2014-12-29T04:00:00';

			var scale = createScale(mockData, config);
			expect(scale.ticks[0].value).toEqual('Dec 28');
		});

		it('should use the max option', function() {
			config.time.unit = 'day';
			config.time.max = '2015-01-05T06:00:00';

			var scale = createScale(mockData, config);

			expect(scale.ticks[scale.ticks.length - 1].value).toEqual('Jan 6');
		});
	});

	it('Should use the isoWeekday option', function() {
		var mockData = {
			labels: [
				'2015-01-01T20:00:00', // Thursday
				'2015-01-02T20:00:00', // Friday
				'2015-01-03T20:00:00' // Saturday
			]
		};

		var config = Chart.helpers.clone(Chart.scaleService.getScaleDefaults('time'));
		config.time.unit = 'week';
		// Wednesday
		config.time.isoWeekday = 3;
		var scale = createScale(mockData, config);
		var ticks = getTicksValues(scale.ticks);

		expect(ticks).toEqual(['Dec 31, 2014', 'Jan 7, 2015']);
	});

	describe('when rendering several days', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					data: []
				}],
				labels: ['2015-01-01T20:00:00', '2015-01-02T21:00:00', '2015-01-03T22:00:00', '2015-01-05T23:00:00', '2015-01-07T03:00', '2015-01-08T10:00', '2015-01-10T12:00'], // days
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'time',
						position: 'bottom'
					}],
				}
			}
		});

		var xScale = chart.scales.xScale0;

		it('should be bounded by the nearest week beginnings', function() {
			expect(xScale.getValueForPixel(xScale.left)).toBeGreaterThan(moment(chart.data.labels[0]).startOf('week'));
			expect(xScale.getValueForPixel(xScale.right)).toBeLessThan(moment(chart.data.labels[chart.data.labels.length - 1]).add(1, 'week').endOf('week'));
		});

		it('should convert between screen coordinates and times', function() {
			var timeRange = moment(xScale.max).valueOf() - moment(xScale.min).valueOf();
			var msPerPix = timeRange / xScale.width;
			var firstPointOffsetMs = moment(chart.config.data.labels[0]).valueOf() - xScale.min;
			var firstPointPixel = xScale.left + firstPointOffsetMs / msPerPix;
			var lastPointOffsetMs = moment(chart.config.data.labels[chart.config.data.labels.length - 1]).valueOf() - xScale.min;
			var lastPointPixel = xScale.left + lastPointOffsetMs / msPerPix;

			expect(xScale.getPixelForValue('', 0, 0)).toBeCloseToPixel(firstPointPixel);
			expect(xScale.getPixelForValue(chart.data.labels[0])).toBeCloseToPixel(firstPointPixel);
			expect(xScale.getValueForPixel(firstPointPixel)).toBeCloseToTime({
				value: moment(chart.data.labels[0]),
				unit: 'hour',
			});

			expect(xScale.getPixelForValue('', 6, 0)).toBeCloseToPixel(lastPointPixel);
			expect(xScale.getValueForPixel(lastPointPixel)).toBeCloseToTime({
				value: moment(chart.data.labels[6]),
				unit: 'hour'
			});
		});
	});

	describe('when rendering several years', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				labels: ['2005-07-04', '2017-01-20'],
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'time',
						position: 'bottom'
					}],
				}
			}
		});

		var xScale = chart.scales.xScale0;
		xScale.update(800, 200);
		var step = xScale.ticksAsTimestamps[1] - xScale.ticksAsTimestamps[0];
		var stepsAmount = Math.floor((xScale.max - xScale.min) / step);

		it('should be bounded by nearest step year starts', function() {
			expect(xScale.getValueForPixel(xScale.left)).toBeCloseToTime({
				value: moment(xScale.min).startOf('year'),
				unit: 'hour',
			});
			expect(xScale.getValueForPixel(xScale.right)).toBeCloseToTime({
				value: moment(xScale.min + step * stepsAmount).endOf('year'),
				unit: 'hour',
			});
		});

		it('should build the correct ticks', function() {
			// Where 'correct' is a two year spacing.
			expect(getTicksValues(xScale.ticks)).toEqual(['2005', '2007', '2009', '2011', '2013', '2015', '2017', '2019']);
		});

		it('should have ticks with accurate labels', function() {
			var ticks = xScale.ticks;
			var pixelsPerYear = xScale.width / 14;

			for (var i = 0; i < ticks.length - 1; i++) {
				var offset = 2 * pixelsPerYear * i;
				expect(xScale.getValueForPixel(xScale.left + offset)).toBeCloseToTime({
					value: moment(ticks[i].value + '-01-01'),
					unit: 'day',
					threshold: 0.5,
				});
			}
		});
	});

	it('should get the correct label for a data value', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					data: [null, 10, 3]
				}],
				labels: ['2015-01-01T20:00:00', '2015-01-02T21:00:00', '2015-01-03T22:00:00', '2015-01-05T23:00:00', '2015-01-07T03:00', '2015-01-08T10:00', '2015-01-10T12:00'], // days
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'time',
						position: 'bottom'
					}],
				}
			}
		});

		var xScale = chart.scales.xScale0;
		expect(xScale.getLabelForIndex(0, 0)).toBeTruthy();
		expect(xScale.getLabelForIndex(0, 0)).toBe('2015-01-01T20:00:00');
		expect(xScale.getLabelForIndex(6, 0)).toBe('2015-01-10T12:00');
	});

	it('should get the correct pixel for only one data in the dataset', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				labels: ['2016-05-27'],
				datasets: [{
					xAxisID: 'xScale0',
					data: [5]
				}]
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						display: true,
						type: 'time'
					}]
				}
			}
		});

		var xScale = chart.scales.xScale0;
		var pixel = xScale.getPixelForValue('', 0, 0);

		expect(xScale.getValueForPixel(pixel).valueOf()).toEqual(moment(chart.data.labels[0]).valueOf());
	});

	it('does not create a negative width chart when hidden', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					data: []
				}]
			},
			options: {
				scales: {
					xAxes: [{
						type: 'time',
						time: {
							min: moment().subtract(1, 'months'),
							max: moment(),
						}
					}],
				},
				responsive: true,
			},
		}, {
			wrapper: {
				style: 'display: none',
			},
		});
		expect(chart.scales['y-axis-0'].width).toEqual(0);
		expect(chart.scales['y-axis-0'].maxWidth).toEqual(0);
		expect(chart.width).toEqual(0);
	});
});
