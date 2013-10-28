(function (window) {

// Стили (css)
// Контейнер - квадрат
// Позиционирование слоев (канвас) в зависимости от типа выше или ниже
//  и соответствие размерам контейнера
// м.б. для подсказок (описание) еще один элемент (всплывающий к примеру)

// Вьюха для канваса
var LayerView = Backbone.View.extend({

	tagName: 'canvas',

	initialize: function (attr) {
		// Некоторые данные / Разметка / Тип слоя / Размеры
		this.marking = attr.marking || false;
		this.type = attr.type || 'goban';
		this.values = attr.values || null;

		// Подписываемся на изменение данных диаграммы
		// (пригодится при редактировании)
		if (this.type !== 'goban') {
			this.listenTo(this.model, 'change:node', this.render);
		}

		// Фикс вьюпорта
		this.fix();
	},

	// Можно рассчитать базовые размеры сетки, если они не заданы
	calc: function () {
		var h = Math.min(this.el.height, this.el.width),
			b, e, s;

		if (this.marking) {
			s = Math.round((l - .5) / 21.5),
		} else {
			s = Math.round((l - .5) / 19.5);
		}

		b = (l - s * 18) / 2,
		e = l - b;

		this.values = {
			length: h,
			stone: s,
			first: b,
			last: e
		};
	},

	fix: function () {
		this.el.height = this.el.offsetHeight;
		this.el.width = this.el.offsetWidth;
	},

	// Рисуем Гобан (фон + сетка + хоси)
	drawGoban: function () {},

	render: function () {
		// Обсчитываем размеры, если не заданы
		if (!this.values) this.calc();

		switch (this.type) {
			case 'marking':
				break;

			case 'stones':
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

var dia = new DiaView({ model: sgf });
dia.$el.appendTo('body');

})(this);