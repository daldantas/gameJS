// Atributos
	var canvas, ctx, ALTURA, LARGURA, maxPulos = 3, velocidade = 6, estadoAtual, record, img,

	pontosParaNovaFase = [5, 10, 15, 20],
	faseAtual = 0,
	labelNovaFase = {
		texto:"",
		opacidade:0.0,
		fadeIn: function(dt) {
			var fadeInId = setInterval(function () {
				if (labelNovaFase.opacidade < 1.0)
					labelNovaFase.opacidade += 0.01;
				else {
					clearInterval(fadeInId);
				}
			}, 10 * dt);
		},
		fadeOut: function(dt) {
			var fadeOutId = setInterval(function () {
				if (labelNovaFase.opacidade > 0.0)
					labelNovaFase.opacidade -= 0.01;
				else {
					clearInterval(fadeOutId);
				}
			}, 10 * dt);
		}
	},

	estados = {
		jogar:0,
		jogando:1,
		perdeu:2
	}
	chao = {
		y: 550,
		x: 0,
		altura: 50,

		atualiza: function() {
			this.x -= velocidade;
			if (this.x <= -30)
				this.x += 30;
			
		},

		desenha: function(){
			spriteChao.desenha(this.x, this.y);
			spriteChao.desenha(this.x + spriteChao.largura, this.y);
		}
	},
	bloco = {
		x: 50,
		y: 0,
		largura: spriteBoneco.largura,
		altura: spriteBoneco.altura,
		gravidade: 1.6,
		velocidade: 0,
		forcaDoPulo: 23.6,
		qntPulos: 0,
		score: 0,
		rotacao: 0,
		vidas: 3,
		colidindo: false,

		atualiza: function() {
			this.velocidade += this.gravidade;
			this.y += this.velocidade;
			this.rotacao += Math.PI / 180 * velocidade;

			if (this.y > chao.y - this.altura && estadoAtual != estados.perdeu) {
				this.y = chao.y - this.altura;
				this.qntPulos = 0;
				this.velocidade = 0;
			}
		},
		pula: function() {
			if (this.qntPulos < maxPulos) {
				this.velocidade = -this.forcaDoPulo;
				this.qntPulos++;
			}
		},
		reset: function() {
			this.velocidade = 0;
			this.y = 0;

			if (this.score > record) {
				localStorage.setItem("record", this.score);
				record = this.score;
			}
			this.vidas = 3;
			this.score = 0;	
			velocidade = 6;
			faseAtual = 0;
			this.gravidade = 1.6; 

		},
		desenha: function(){
			ctx.save();
			ctx.translate(this.x + this.largura / 2, this.y + this.altura / 2);
			ctx.rotate(this.rotacao);
			spriteBoneco.desenha(-this.largura / 2, -this.altura / 2);
			ctx.restore();
		}
	},
	obstaculos = {
		_obs: [],
		_scored: false,
		_sprites: [redObstacle, pinkObstacle, blueObstacle, greenObstacle, yellowObstacle],
		tempoInsere: 0,

		insere: function(){
			this._obs.push({
				x: LARGURA,
				y: chao.y - Math.floor(20 + Math.random() * 100),
				// largura: 30 + Math.floor(21 * Math.random()),
				largura: 50,
				sprite: this._sprites[Math.floor(this._sprites.length * Math.random())]
			});
			this.tempoInsere = 30 + Math.floor(21 * Math.random());
		},

		atualiza: function(){
			if (this.tempoInsere == 0) {
				this.insere();
			}
			else {
				this.tempoInsere--;
			}

			for (var i = 0, tam = this._obs.length; i < tam; i++) {
				var obs = this._obs[i];

				obs.x -= velocidade;

				if (!bloco.colidindo && obs.x <= bloco.x + bloco.largura && bloco.x <= obs.x + obs.largura && obs.y <= bloco.y + bloco.altura){
					bloco.colidindo = true;
					setTimeout(function () {
						bloco.colidindo = false;	
					}, 500);
					if (bloco.vidas >= 1)
						bloco.vidas--;
					else
						estadoAtual = estados.perdeu;
				}
					

				else if (obs.x <= 0 && !obs._scored) {
					bloco.score++;
					obs._scored = true;
					if (faseAtual < pontosParaNovaFase.length && bloco.score == pontosParaNovaFase[faseAtual])
						passarDeFase();
				}


				else if (obs.x <= -obs.largura) {
					this._obs.splice(i, 1);
					tam--;
					i--;
				}
			}
		},

		limpa: function() {
			this._obs = [];
		},

		desenha: function(){
			for (var i = 0, tam = this._obs.length; i < tam; i++) {
				var obs = this._obs[i];
				obs.sprite.desenha(obs.x, obs.y);

			}
		}
	}
	;
// Fim Atributos

// Métodos
	function clique(event) {
		if (estadoAtual == estados.jogando) {
			bloco.pula();
		}
		else if (estadoAtual == estados.jogar) {
			estadoAtual = estados.jogando;
		}
		else if (estadoAtual == estados.perdeu && bloco.y >= 2 * ALTURA) {
			estadoAtual = estados.jogar;
			obstaculos.limpa();
			bloco.reset();

		}
	}

	function passarDeFase() {
		velocidade++;
		faseAtual++;
		bloco.vidas++;

		if (faseAtual == 4)
			bloco.gravidade *= 0.6;

		labelNovaFase.texto = "Level " + faseAtual;
		labelNovaFase.fadeIn(0.4);
		setTimeout(function () {
			labelNovaFase.fadeOut(0.4);
		}, 800);
	}

	function main() {
		ALTURA = window.innerHeight;
		LARGURA = window.innerWidth;
		if (LARGURA >= 500)
		{
			LARGURA = 600;
			ALTURA = 600;
		}
		canvas = document.createElement("canvas");
		canvas.width = LARGURA;
		canvas.height = ALTURA;
		canvas.style.border = "1px solid #000";
		
		ctx = canvas.getContext("2d");
		document.body.appendChild(canvas);
		document.addEventListener("mousedown", clique);

		estadoAtual = estados.jogar;

		record = localStorage.getItem("record");
		if (record == null) 
			record = 0;

		img = new Image();
		img.src = "assets/images/sheetImage.png";



		roda();
	}

	function roda() {
		atualiza();
		desenha();

		window.requestAnimationFrame(roda);
	}
	function atualiza() {

		if (estadoAtual == estados.jogando) {
			obstaculos.atualiza();	
		}			
			chao.atualiza();
			bloco.atualiza();

	}
	function desenha() {

		bg.desenha(0, 0);

		ctx.fillStyle = "#fff";
		ctx.font = "50px Arial";
		ctx.fillText(bloco.score, 30, 68);
		ctx.fillText(bloco.vidas, 540, 68);

		ctx.fillStyle = "rgba(0, 0, 0, " + labelNovaFase.opacidade + ")";
		ctx.fillText(labelNovaFase.texto, canvas.width/2 - ctx.measureText(labelNovaFase.texto).width/2, canvas.height/3);

		if (estadoAtual == estados.jogando) {
			obstaculos.desenha();
		}

		chao.desenha();
		bloco.desenha();

		if (estadoAtual == estados.jogar) {
			jogar.desenha(LARGURA/2 - jogar.largura/2, ALTURA/2 - jogar.altura/2);
		}

		if (estadoAtual == estados.perdeu) {
			perdeu.desenha(LARGURA/2 - perdeu.largura/2, ALTURA/2 - perdeu.altura/2 - spriteRecord.altura/2);
			spriteRecord.desenha(LARGURA/2 - spriteRecord.largura/2, ALTURA/2 + perdeu.altura/2 - spriteRecord.altura/2 - 24);
			ctx.fillStyle = "white";

			if (bloco.score > record) {
				novo.desenha(LARGURA/2 - 180, ALTURA/2 + 31);
				ctx.fillText(bloco.score, 420, 470);
			}
			else {
				ctx.fillText(bloco.score, 375, 390);
				ctx.fillText(record, 420, 470);
			}
		}
	}
// Fim Métodos
// Inicializa;
	main();