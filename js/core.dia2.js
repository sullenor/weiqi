'use strict';

(function (window) {

// Стили (css)
// Контейнер - квадрат
// Позиционирование слоев (канвас) в зависимости от типа выше или ниже
//  и соответствие размерам контейнера
// м.б. для подсказок (описание) еще один элемент (всплывающий к примеру)



// Вьюха для канваса
var LayerView = Backbone.View.extend({

	tagName: 'canvas',

	defaults: function () {
		return {
			color: {
				bg:   '#d9af5b',
				line: '#665544'
			},
			marking: false,
			type: 'goban'
		};
	},

	initialize: function (attr) {
		// Набор параметров по умолчанию
		this.defaults = this.defaults();

		// Для тестов
		this.$el.css({ height: '300px', width: '300px' });

		// Обновляем параметры
		if (attr.marking) this.defaults.marking = attr.marking;
		if (attr.type) this.defaults.type = attr.type;

		// Обновляем размеры
		this.values = attr.values;

		// Подписываемся на изменение данных диаграммы
		// (пригодится при редактировании)
		if (this.type !== 'goban') {
			this.listenTo(this.model, 'change:node', this.render);
		}

		// Сохраняем ссылку на контекст для работы с канвасом
		this.cn = this.el.getContext('2d');
	},



	//--------------------- Низкоуровневые функции --------------------//

	// Небольшой набор функций для работы с канвасом /
	// Работаем в основном с сохраненным свойством cn (контекст канваса)

	// Устанавливаем новый набор св-в
	attr: function (attr) {
		var c = this.cn;

		_.each(attr, function (v, k) {
			c[k] = v;
		});

		return this;
	},

	circle: function (x, y, r) {
		this.cn.arc(x, y, r, 0, 2 * Math.PI);

		return this;
	},

	line: function (x0, y0, x1, y1) {
		var c = this.cn;

		c.moveTo(x0, y0);
		c.lineTo(x1, y1);

		return this;
	},

	rect: function (x, y, xl, yl) {
		this.cn.fillRect(x, y, xl, yl);

		return this;
	},

	text: function (x, y, letter) {
		this.cn.fillText(letter, x, y);

		return this;
	},

	// Хэш colors для метода addColorStop
	radialGradient: function (x0, y0, r0, x1, y1, r1, colors) {
		var c = this.cn,
			g = c.createRadialGradient(x0, y0, r0, x1, y1, r1);

		_.each(colors, function (v, k) {
			g.addColorStop(+k, v);
		});

		c.fillStyle = g;

		return this;
	},

	beginPath: function () {
		this.cn.beginPath();

		return this;
	},

	closePath: function () {
		this.cn.closePath();
		
		return this;
	},

	fill: function () {
		this.cn.fill();

		return this;
	},

	stroke: function () {
		this.cn.stroke();

		return this;
	},



	//--------------------- Какие-то общие функции --------------------//

	// Можно рассчитать базовые размеры сетки, если они не заданы
	calc: function () {
		var h = Math.min(this.el.height, this.el.width),
			b, e, s;

		if (this.defaults.marking) {
			s = Math.round((h - .5) / 21.5);
		} else {
			s = Math.round((h - .5) / 19.5);
		}

		b = Math.round((h - s * 18) / 2),
		e = h - b;

		return {
			size: h,
			stone: s,
			first: b,
			last: e
		};
	},

	// Фиксируем вьюпорт канваса
	fix: function () {
		this.el.height = this.el.offsetHeight;
		this.el.width = this.el.offsetWidth;
	},



	// Рисуем Гобан (фон + сетка + хоси)
	drawGoban: function () {
		var h = this.values.size,
			s = this.values.stone,
			b = this.values.first,
			e = this.values.last,
			color = this.defaults.color;

		// Фон
		if (this.defaults.marking) {
			this.attr({ fillStyle: color.line })
				.beginPath()
				.rect(0, 0, h, h)
				.attr({ fillStyle: color.bg, strokeStyle: color.line })
				.rect(s, s, h - 2 * s, h - 2 * s);
		} else {
			this.attr({ fillStyle: color.bg, strokeStyle: color.line })
				.beginPath()
				.rect(0, 0, h, h);
		}

		// Линии
		for (var i = 0, k; i < 19; i++) {
			k = b + s * i + .5;

			this.line(b + .5, k, e + .5, k)
				.line(k, b + .5, k, e + .5);
		}

		this.stroke();

		// Хоси (точки)
		this.attr({ fillStyle: color.line });

		var x = [],
			dx = Math.ceil(s / 10);

		for (var i = 3; i < 19; i += 6) {
			x.push(s * i + b - dx);
		}

		for (var i = 0, dy = dx * 2 + 1; i < 3; i++) {
			this.rect(x[0], x[i], dy, dy)
				.rect(x[1], x[i], dy, dy)
				.rect(x[2], x[i], dy, dy);
		}
	},

	// Рисуем Камень
	drawStone: function (coords) {},
	// Рисуем Метки (круги и т.п., можно описать через несколько функций)
	drawMarks: function (coords) {},

	// Парсим модель, в качестве агрумента передаем массив со св-вами
	parse: function (arr) {},



	render: function () {
		// Фикс вьюпорта
		this.fix();

		// Обновляем размеры
		if (!this.values) this.values = this.calc();

		switch (this.type) {
			case 'marking':
				this.parseMarks();
				break;

			case 'stones':
				this.parseStones();
				break;

			default:
				this.drawGoban();
		}

		return this;
	}
});



// Вьюха для диаграммы
var DiaView = Backbone.View.extend({

	className: 'goban',
	tagName:   'div',

	// Создание вьюхи
	// Создаем заглушку и маленькие вьюхи для канваса
	initialize: function () {},

	// Перерисовка вьюхи
	// Отрисовываем маленькие вьюхи по новой
	render: function () {}
});



// Крутая вьюха для редактирования диаграммы
var DiaEditView = Backbone.View.extend({});



// Какой-нибудь Модуль для глобального доступа



// Небольшой пример / Некоторые данные
var sgf = new Backbone.Model({ 'node': '(;AW[cb][eb][dc][ic][jc][ed][fd][id][kd][ke][if][jf][lf][mf][nf][pf][qf][dg][fg][gg][hg][jg][ng][fh][rh][di][gi][hi][ki][ni][ri][ij][kj][oj][rj][kk][kl][jm][lm][mm][om][jn][rn][co][jo][po][ro][kp][lp][op][pp][rp][dq][lq][oq][qq]AB[jb][cc][fc][kc][lc][cd][gd][jd][ld][nd][pd][de][ee][fe][ie][qe][gf][hf][ig][mg][gh][hh][ih][jh][kh][lh][qh][fi][li][pi][fj][lj][qj][ik][rk][ll][ml][nl][ol][pl][qm][rm][in][qn][io][jp][gq][jq][kq][pq][rq][lr][nr][or][pr][qr]LB[ij:1]C[White just played 1. Black to move])' });

var dia = new LayerView({ model: sgf });
dia.$el.appendTo('body');
dia.render();

var dia = new LayerView({ model: sgf, marking: true });
dia.$el.appendTo('body');
dia.render();

})(this);