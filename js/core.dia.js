/**
 * Вьюшка для отображения игровых диаграмм
 *
 * Автор: Алексей Литвинов
 */

// В качестве альтернативы можно попробовать использовать
// По одной вьюшке на канвас и общую вьюшку для диаграммы

(function (window) {

// Объект для хранения диаграмм и их отрисовки при необходимости
var Dias = (function () {

	var col = {}, // коллекция
		ids = 0;

	return {
		add: function (view) {
			if (!view.ids) view.ids = ++ids;

			col[ids] = view;
		},
		check: function (view, dx) {
			var rect = view.el.getBoundingClientRect(),
				dx = dx || 0;

			return rect.left < screen.availWidth + dx
				&& rect.right + dx > 0
				&& rect.top < screen.availHeight + dx
				&& rect.bottom + dx > 0;
		},
		render: function () {
			_.each(col, function (view, ids) {
				if (this.check(view)) {
					// Удаляем из коллекции
					delete col[ids];					
					// отрисовываем
					view.render();
				}
			}, this);
		}
	};

})();



// Сама вьюшка
var DiagramView = Backbone.View.extend({

	// Общий контейнер
	className: 'goban',
	tagName:   'div',

	// Параметры по умолчанию
	defaults: function () {
		return {
			// цветовая схема
			color: {
				bg:   '#d9af5b',
				line: '#665544'
			},
			// буквенно-цифровая разметка
			marking: false
		};
	},

	// Обработка полученных параметров
	initialize: function (param) {
		this.defaults = this.defaults();

		_.each(this.defaults, function (v, k) {
			if (param[k]) this.defaults[k] = param[k];
		}, this);
	},



	// Фикс вьюпорта канваса
	fix: function () {
		this.gb.height = this.gb.offsetHeight;
		this.gb.width = this.gb.offsetWidth;
	},

	// Преобразование буквенных координат в численные
	convert: function (pair) {
		var a = 'a'.charCodeAt(0) - 1,
			x = pair.charCodeAt(0) - a,
			y = pair.charCodeAt(1) - a;

		return { x: x, y: y };
	},

	// Парсит узел (данные модели)
	parse: function () {
		var pairPattern = /(AB|AW|MA|TR|CR|SQ|LB|SL)((?:\[[^\]]+?\])*)/g,
			coordPattern = /\[([a-z]{2}?)(?::([a-z0-9]+))?\]/ig,
			node = this.model.get('node'),
			pair,
			allCoords,
			coord,
			nCoords;

		while (pair = pairPattern.exec(node)) {
			allCoords = String(pair[2]);

			while (coord = coordPattern.exec(allCoords)) {
				nCoords = this.convert(coord[1]);

				switch (pair[1]) {
					case 'AB':
						this.drawStone(nCoords, false);
						break;

					case 'AW':
						this.drawStone(nCoords, true);
						break;

					case 'MA':
						this.drawCross(nCoords);
						break;

					case 'TR':
						this.drawTriangle(nCoords);
						break;

					case 'CR':
						this.drawCircle(nCoords);
						break;

					case 'SQ':
						this.drawSquare(nCoords);
						break;

					case 'LB':
						this.drawLetter(nCoords, coord[2]);
						break;

					case 'SL':
						this.drawMark(nCoords);
						break;
				}
			}
		}
	},



	// Рисуем доску
	draw: function () {
		var c = this.gb.getContext('2d'),
			h = this.gb.height,
			w = this.gb.width,
			l = Math.min(h, w),
			color = this.defaults.color,
			marking = this.defaults.marking;

		var s,b,e;

		// Закрашиваем доску
		if (marking) {
			// С разметкой
			s = Math.round((l - .5) / 21.5);
			b = (l - s * 18) / 2,
			e = l - b;

			c.beginPath();
			c.fillStyle = color.line;
			c.fillRect(0, 0, l, l);
			c.fillStyle = color.bg;
			c.fillRect(s, s, l - 2 * s, l - 2 * s);

			// Разметка
			var fs = Math.round(s / 2),
				letter = 'ABCDEFGHJKLMNOPQRST'.split('');

			c.font = fs + 'px Arial';
			c.textAlign = 'center';
			c.strokeStyle = color.bg;
			c.beginPath();

			for (var x0 = l - fs, y0 = fs * 1.5, y1 = l - fs / 2, y2, z, i = 0; i < 19; i++) {
				z = b + s * i;
				y2 = z + fs / 2;

				c.fillText(19 - i, fs, y2);
				c.fillText(19 - i, x0, y2);
				c.fillText(letter[i], z, y0);
				c.fillText(letter[i], z, y1);
			}
		} else {
			// Без разметки
			s = Math.round((l - .5) / 19.5);
			b = (l - s * 18) / 2,
			e = l - b;

			c.beginPath();
			c.fillStyle = color.bg;
			c.fillRect(0, 0, l, l);
		}

		// Разлиновываем доску
		c.strokeStyle = color.line;

		for (var k, i = 0; i < 19; i++) {
			k = Math.round(s * i + b);
			c.moveTo(b + .5, k + .5);
			c.lineTo(e + .5, k + .5);
			c.moveTo(k + .5, b + .5);
			c.lineTo(k + .5, e + .5);
		}

		c.stroke();

		// Хоси
		c.fillStyle = color.line;

		var x = [],
			dx = Math.ceil(s / 10);

		for (var i = 4; i < 19; i += 6) {
			x.push(Math.round(s * (i - 1) + b) - dx);
		}

		for (var i = 0, dy = dx * 2 + 1; i < 3; i++ ) {
			c.fillRect(x[0], x[i], dy, dy);
			c.fillRect(x[1], x[i], dy, dy);
			c.fillRect(x[2], x[i], dy, dy);
		}

		// Хранение промежуточных данных
		this.values = {
			context: c,
			length: l,
			stone: s,
			first: b,
			last: e
		};
	},
	// Метка: круг
	drawCircle: function () {},
	// Метка: крест
	drawCross: function () {},
	// Метка: буква / цифра
	drawLetter: function (coord, letter) {
		var s = this.values.stone,
			b = this.values.first,
			c = this.values.context,
			x = Math.round(coord.x * s + b),
			y = Math.round(coord.y * s + b + s / 6);

		var color = c.getImageData(x, y, 1, 1).data;
		color = (color[0] + color[1] + color[2]) / 3;

		if (color > 85) {
			c.fillStyle = '#000';
		} else {
			c.fillStyle = '#fff';			
		}

		c.textAlign = 'center';
		c.fillText(letter, x, y);
	},
	// Метка: активный камень
	drawMark: function () {},
	// Метка: квадрат
	drawSquare: function () {},
	// Камень
	drawStone: function (coord, white) {
		var s = this.values.stone,
			b = this.values.first,
			c = this.values.context,
			x = Math.round(coord.x * s + b),
			y = Math.round(coord.y * s + b),
			r = Math.round(s / 2),
			sr = s / 20,
			d = Math.round(s / 6);

		c.beginPath();
		c.arc(x, y, r, 0, 2 * Math.PI);

		if (white) {
			var gr = c.createRadialGradient(x - d, y - d, sr, x, y, r);
			gr.addColorStop(0, '#fefefe');
			gr.addColorStop(.9, '#bababb');
			gr.addColorStop(1, '#808080');
		} else {
			var gr = c.createRadialGradient(x - d, y - d, sr, x, y, r);
			gr.addColorStop(0, '#4b4b4b');
			gr.addColorStop(.9, '#000');
			gr.addColorStop(1, '#808080');
		}

		c.fillStyle = gr;
		c.fill();
	},
	// Метка: треугольник
	drawTriangle: function () {},



	// Первоначальный рендер
	// рисуем заглушку и подписываемся на событие для первичной отрисовки
	dom: function () {
		Dias.add(this);

		// Перенести потом в css
		this.$el.css({ margin: '10px', height: '400px', width: '400px' });

		return this;
	},

	// Отрисовка доски с диаграммой
	render: function () {
		console.time('Diagram render');
		// Создаем метки на полотно
		this.$gb = $('<canvas style="height: 100%; width: 100%">');
		this.gb = this.$gb.get(0);

		// Добавляем полотно в DOM
		this.$el.append( this.gb );

		// Фикс и отрисовка
		this.fix();
		this.draw();
		this.parse();
		console.timeEnd('Diagram render');

		return this;
	}

});



//var sgf = new Backbone.Model({ 'node': 'CR[gn][io]LB[gd:A][he:B][cm:1][cq:2][fq:3]TR[ce][dh]SQ[kj][im]' });
var sgf = new Backbone.Model({ 'node': '(;AW[cb][eb][dc][ic][jc][ed][fd][id][kd][ke][if][jf][lf][mf][nf][pf][qf][dg][fg][gg][hg][jg][ng][fh][rh][di][gi][hi][ki][ni][ri][ij][kj][oj][rj][kk][kl][jm][lm][mm][om][jn][rn][co][jo][po][ro][kp][lp][op][pp][rp][dq][lq][oq][qq]AB[jb][cc][fc][kc][lc][cd][gd][jd][ld][nd][pd][de][ee][fe][ie][qe][gf][hf][ig][mg][gh][hh][ih][jh][kh][lh][qh][fi][li][pi][fj][lj][qj][ik][rk][ll][ml][nl][ol][pl][qm][rm][in][qn][io][jp][gq][jq][kq][pq][rq][lr][nr][or][pr][qr]LB[ij:1]C[White just played 1. Black to move])' });

var dia1 = new DiagramView({ model: sgf, marking: true });
var dia2 = new DiagramView({ model: sgf });

$('body').append( dia1.dom().el, dia2.dom().el );

Dias.render();

})(this);