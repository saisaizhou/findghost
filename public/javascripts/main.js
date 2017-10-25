var slideIndex = 1;
var custome_vision_url = "请填入你的Custom Vision模型访问URL";
var custom_vision_key = "请填入你的Custom Vision模型访问密钥";

window.onload = function () {

	//
	showDivs(slideIndex);
	var file = document.getElementById('file');
	var photo = document.getElementById('photo');
	var photoWrap = document.getElementById('photo-wraper');
	var photosWrap = document.getElementById('photos-wrap');
	file.onchange = function () {
		//document.getElementById('hint').innerHTML = 'file change啦！！！';
		var photoWrap = document.getElementById('photo-wraper');
		var nname = photoWrap.firstChild.nodeName;
		var p = this.files.length !== 0 ? this.files[0] : null;
		console.log(p.size);
		if (p.size >= 4190000) {
			//console.log('Photo\'s size is too large to deal!');
			document.getElementById('hint').innerHTML = '照片太大啦！！';
			alert("照片太大啦！！");
			return;
		}
		if (p) {
			var reader = new FileReader();
			var img;
			if (!reader) {
				this.value = '';
				return;
			}
			var orientation;
			//EXIF js 可以读取图片的元信息  https://github.com/exif-js/exif-js
			EXIF.getData(p, function () {
				orientation = EXIF.getTag(this, 'Orientation');
			});
			reader.onload = function (e) {

				rotateImg(this.result, orientation, function (data) {
					//这里可以使用校正后的图片data了 

					document.getElementById('photos-wrap').style.display = 'none';
					document.getElementById('photo-wrap').style.display = 'block';
					document.getElementById('useother').style.display = 'block';
					
					document.getElementById('hint').innerHTML = '';
					this.value = '';
					img = data;
					if (document.getElementById('canvas')) {
						document.getElementById('photo-wraper').removeChild(document.getElementById('canvas'));
					}
					var photo = document.createElement('img');
					photo.id = 'photo';
					photo.classList.add('photo');
					console.log(img);
					photo.src = img;
					document.getElementById('photo-wraper').appendChild(photo);
					//checkDirection(img,photo);
					markFace(img);
				});
			};
			reader.readAsDataURL(p);
		}
		this.value = "";
	};

	
};

function makeBlob(dataURL) {
	var BASE64_MARKER = ';base64,';
	if (dataURL.indexOf(BASE64_MARKER) == -1) {
		var parts = dataURL.split(',');
		var contentType = parts[0].split(':')[1];
		var raw = decodeURIComponent(parts[1]);
		return new Blob([raw], { type: contentType });
	}
	var parts = dataURL.split(BASE64_MARKER);
	var contentType = parts[0].split(':')[1];
	var raw = window.atob(parts[1]);
	var rawLength = raw.length;

	var uInt8Array = new Uint8Array(rawLength);

	for (var i = 0; i < rawLength; ++i) {
		uInt8Array[i] = raw.charCodeAt(i);
	}

	return new Blob([uInt8Array], { type: contentType });
}

function markFace(img) {
	var photoWrap = document.getElementById('photo-wraper');
	//console.log(photoWrap);
	if (document.getElementById('photo')) {
		var photo = document.getElementById('photo');
	} else {
		if (!img) {
			console.log('没有照片哈'); return;
		}
		var photo = document.createElement('img');
		photo.id = 'photo';
		photo.classList.add('photo');
		console.log("你选择了 " + img);
		photo.src = img;
		document.getElementById('photo-wraper').appendChild(photo);
	}

	if (img == null) getBase64FromImageUrl(photo);
	else postImageToCustomVision(photo, img);
}


function postImageToCustomVision(photo, img) {
      
        $.ajax({
            //url: "https://southcentralus.api.cognitive.microsoft.com/customvision/v1.0/Prediction/73d9eca4-760b-4fdb-a301-98786e5075a3/image?" + $.param(params),
			//url: "https://southcentralus.api.cognitive.microsoft.com/customvision/v1.0/Prediction/73d9eca4-760b-4fdb-a301-98786e5075a3/image",
			url: custome_vision_url,
			beforeSend: function(xhrObj){
                // Request headers
                xhrObj.setRequestHeader("Content-Type","application/octet-stream");
                xhrObj.setRequestHeader("Prediction-key",custom_vision_key);
            },
            type: "POST",
			// Request body
			processData: false,
            data: makeBlob(img),
        })
        .done(function(data) {
			var w = photo.width,
				h = photo.height;

			var testimg = new Image();

			testimg.setAttribute('crossOrigin', 'anonymous');

			testimg.onload = function () {
				var soucrew = this.width, soucreh = this.height;

				var wratio = w / soucrew, hratio = h / soucreh;

				var photoWrap = document.getElementById('photo-wraper');
				var canvas = document.createElement('canvas');
				canvas.id = 'canvas';
				canvas.width = w;
				canvas.height = h;
				var ctx = canvas.getContext('2d');
				ctx.lineWidth = '20px';
				ctx.strokeStyle = 'rgba(255,255,255,1)'
				ctx.fillStyle = 'rgba(255,100,50,1)';
				ctx.drawImage(photo, 0, 0, w, h);
				photoWrap.removeChild(document.getElementById('photo'));
				//checkDirection(photo,canvas);
				photoWrap.appendChild(canvas);
				document.getElementById('emotionword').innerHTML = getTagWords(getMaxTag(data));
				document.getElementById('photo-wraper').style.display = 'block';
				document.getElementById('title-img').style.display = 'none';

			};

			testimg.src = img;
        })
        .fail(function() {
            alert("error");
        });
}


function getBase64FromImageUrl(photo) {
	var img = new Image();

	img.setAttribute('crossOrigin', 'anonymous');

	img.onload = function () {
		var canvas = document.createElement("canvas");
		canvas.width = this.width;
		canvas.height = this.height;

		var ctx = canvas.getContext("2d");
		ctx.drawImage(this, 0, 0);

		var dataURL = canvas.toDataURL("image/jpeg");

		postImageToCustomVision(photo, dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
	};

	img.src = photo.src;
}



function getMaxTag(data) {

	var result = "未知";
	var maxscore = 0.5;
	var count = data.Predictions.length;
	for (i = 0 ; i < count ; i ++ ){
		if (data.Predictions[i].Probability > maxscore) {
			maxscore = data.Predictions[i].Probability;
			result = data.Predictions[i].Tag;
		}
	}
	return result;
}

function getTagWords(Tag)
{
	if (Tag === "牛头马面") return "牛头马面：取材于中国传统文化中勾魂使者的形象。据《铁城泥犁经》说：阿傍为人时，因不孝父母，死后在阴间为牛头人身，担任巡逻和搜捕逃跑罪人的衙役。有资料说佛教最初只有牛头，传入中国时，由于中国民间最讲对称、成双，才又配上了马面。但也有资料说马面也称马面罗刹，同样来自佛家。但本人在查阅资料中，并未发现印度神话中有马面作为冥府差役的说法。密宗中到是有“马面明王”的形象，但那是密宗佛教中的一位大神，相传是观音菩萨的化身，和冥府差役相距甚远。";
	if (Tag === "黑白无常") return "黑白无常：亦称无常。是中国传统文化中的一对神祇，也是最有名的鬼差。此二神手执脚镣手铐，专职缉拿鬼魂、协助赏善罚恶，也常为阎罗王、城隍、东岳大帝等冥界神明的部将。白无常名为谢必安，属阳。时常满面笑容，身材高瘦，面色惨白，口吐长舌，其头上官帽写有“一见生财”四字，予感谢并对恭敬神明之人以好运，尊之曰“活无常”，“白爷”等。对男性吸其阴魂，对女性散其阴魄。黑无常名为范无救（或称无赦、无咎），属阴。面容凶悍，身宽体胖，个小面黑，官帽上写有“天下太平”四字，意为对违抗法令身负罪过者一概无赦，尊之曰“矮爷”或“黑爷”。对女性吸其阳魂，对男性散其阳魄。";
	if (Tag === "迪亚波罗") return "迪亚波罗：暴雪游戏《暗黑破坏神》中三魔神里最年轻的一位，但我发现他也是最危险的一位 —— 他对恐惧的控制能力几乎是无法战胜的。虽然他能非常轻易的占据和腐化许多人类，但迪亚波罗的精华最终还是被囚禁在了灵魂石中，被流放到无尽深渊长达20年之久。";
	if (Tag === "摄魂怪") return "摄魂怪：出现于小说《哈利·波特》系列小说，在《哈利·波特与阿兹卡班的囚徒》中首次出现。是一种生物，披着一件斗篷，全身都像在水里泡烂了一样，有着结痂的手掌，全身腐烂了一样。凡是此物经过的地方，都会被吸去快乐，让你想起最可怕的事，并且他的兜帽下面的“嘴”会吸去人们的灵魂。他们守卫着阿兹卡班（魔法世界的牢房）。只有守护神咒才能驱逐。";
	if (Tag === "南瓜头") return "南瓜头：传说源于古代爱尔兰。曾经有一个名叫 Jack（杰克）的人，是个醉汉且爱恶作剧。一天， Jack 把恶魔骗上了树，随即在树桩上刻了个十字，恐吓恶魔让他不敢下来。为了下树，恶魔与Jack约法三章，答应施法让 Jack 永远不会犯罪为交换条件。 Jack 死后，他的灵魂既不能上天堂又不能下地狱，只好靠一根小蜡烛照亮着，指引其在天地之间倘佯。这根小蜡烛是在一根挖空的萝卜里放着，称作“JACK LANTERNS”，而古老的萝卜灯演变到今天，就变成了南瓜做的 Jack-O-Lantern 了。据说爱尔兰人到了美国不久，即发现南瓜不论从来源和雕刻来说都比萝卜更胜一筹，于是南瓜就成了万圣节的宠物。";
	if (Tag === "吸血鬼") return "吸血鬼：早期吸血鬼的传说流传于巴尔干半岛与东欧斯拉夫一带。在这些传说中，吸血鬼指从坟墓中爬起来吸食人血的亡者尸体。但近一百多年来随着小说、电影、流行文化的不断改编，吸血鬼的共通形象也已经逐渐演变为一类必须以吸血来保持生命力、在夜间活动、具有超自然力量的奇幻生物。";
	if (Tag === "女巫") return "女巫：又称魔女，是西方文化中使用巫术、魔法、占星术并且以此类超自然能力行事的女性，据传说分为白女巫与黑女巫两种，白女巫使用白魔法，黑女巫使用黑魔法。与此相对，会使用魔法的男性则称之为男巫(Wizard、Warlock)。";
	if (Tag === "狼人") return "狼人：近半个世纪以来，狼人无疑已经成为西方神秘文化中最热门的话题之一，这种怪物平时从外表上看与常人并无不同，但一到月圆之夜就会变身为狼人，失去理性并变的狂暴。";
	if (Tag === "贞子") return "贞子：全名山村贞子，经典恐怖形象之一。出自1991年至1999年出版的系列科幻恐怖小说《午夜凶铃》。山村贞子是超能力研究者伊熊平八郎与超能力者山村志津子的长女，继承了母亲的特殊能力，拥有可以控制人类生死的超能力。贞子具有天生的世间罕有的美丽，但是却是个得了罕见遗传病“睾丸性女性症候群”的阴阳人。19岁的贞子加入了飞翔剧团，因为一次观看没有插上插头却有画面的电视机而被人熟知。一次在医院探望父亲的时候，用超能控制了色迷心窍的全日本最后的一个天花病病者强奸自己，并控制他的意念让他将自己投入枯井里。在枯井里，贞子用怨念制成了生前记忆深处的残像和诅咒，封印在录影带里，每一个看到录影带的人都会在7天后死亡或生产。";
	if (Tag === "钟馗") return "钟馗：姓钟名馗字正南，中国民间传说中能打鬼驱除邪祟的神。旧时中国民间常挂钟馗的像辟邪除灾。是中国传统文化中的“唐·赐福镇宅圣君”。古书记载他系唐初长安终南人，（据古籍记载及专家学者考证，钟馗为今陕西省西安秦岭中段终南山下周至县终南镇终南村人，现存终南钟馗故里庙），生铁面虬鬓，相貌奇异；然而却是个才华横溢、满腹经纶、学富五车、才高八斗的人物，平素正气浩然，刚直不阿，待人正直。";

	else return "天呐，恭喜你发现了这个世界上的新的鬼种，快点带上你的鬼去申请专利吧！";

}

// @param {string} img 图片的base64
// @param {int} dir exif获取的方向信息
// @param {function} next 回调方法，返回校正方向后的base64
function rotateImg(img, dir, next) {
	var image = new Image();
	image.onload = function () {
		var degree = 0, drawWidth, drawHeight, width, height;
		drawWidth = this.naturalWidth;
		drawHeight = this.naturalHeight;
		//以下改变一下图片大小
		var maxSide = Math.max(drawWidth, drawHeight);
		if (maxSide > 1024) {
			var minSide = Math.min(drawWidth, drawHeight);
			minSide = minSide / maxSide * 1024;
			maxSide = 1024;
			if (drawWidth > drawHeight) {
				drawWidth = maxSide;
				drawHeight = minSide;
			} else {
				drawWidth = minSide;
				drawHeight = maxSide;
			}
		}
		var canvas = document.createElement('canvas');
		canvas.width = width = drawWidth;
		canvas.height = height = drawHeight;
		var context = canvas.getContext('2d');
		//判断图片方向，重置canvas大小，确定旋转角度，iphone默认的是home键在右方的横屏拍摄方式
		switch (dir) {
			//iphone横屏拍摄，此时home键在左侧
			case 3:
				degree = 180;
				drawWidth = -width;
				drawHeight = -height;
				break;
			//iphone竖屏拍摄，此时home键在下方(正常拿手机的方向)
			case 6:
				canvas.width = height;
				canvas.height = width;
				degree = 90;
				drawWidth = width;
				drawHeight = -height;
				break;
			//iphone竖屏拍摄，此时home键在上方
			case 8:
				canvas.width = height;
				canvas.height = width;
				degree = 270;
				drawWidth = -width;
				drawHeight = height;
				break;
		}
		//使用canvas旋转校正
		context.rotate(degree * Math.PI / 180);
		context.drawImage(this, 0, 0, drawWidth, drawHeight);
		//返回校正图片
		next(canvas.toDataURL("image/jpeg", .8));
	}
	image.src = img;
}

function ff(photo) {
	
	var newphoto = document.createElement('img');
	newphoto.id = 'photo';
	newphoto.classList.add('photo');
	newphoto.src = photo.src;
	if (document.getElementById('canvas')) {
		document.getElementById('photo-wraper').removeChild(document.getElementById('canvas'));
	}
	document.getElementById('photo-wraper').appendChild(newphoto);
	document.getElementById('photos-wrap').style.display = 'none';
	document.getElementById('photo-wrap').style.display = 'block';
	document.getElementById('photo-wraper').style.display = 'block';
	document.getElementById('useother').style.display = 'block';
	//document.getElementById('back').style.display = 'block';

	// var reader = new FileReader();
	// reader.onload = function (e) {
	// 	markFace(e.result);
	// }
	// reader.readAsDataURL('/assets/' + path);
	markFace(null);
};
function vm() {
	if (document.getElementById('photo')) {
		document.getElementById('photo-wraper').removeChild(document.getElementById('photo'));
	} else {
		document.getElementById('photo-wraper').removeChild(document.getElementById('canvas'));
	}
	document.getElementById('photo-wrap').style.display = 'none';
	document.getElementById('photo-wraper').style.display = 'none';
	document.getElementById('photos-wrap').style.display = 'block';
	document.getElementById('useother').style.display = 'none';
	document.getElementById('title-img').style.display = 'block';
	
	//document.getElementById('back').style.display = 'none';
}
function tipOn(photo) {
	document.getElementById(photo.id).getElementsByTagName('div')[0].style.display = "block";
};
function tipOff(photo) {
	document.getElementById(photo.id).getElementsByTagName('div')[0].style.display = 'none';
}


function plusDivs(n) {
  showDivs(slideIndex += n);
}

function currentDiv(n) {
  showDivs(slideIndex = n);
}

function showDivs(n) {
  var i;
  var x = document.getElementsByClassName("mySlides");
  var dots = document.getElementsByClassName("demo");
  if (n > x.length) {slideIndex = 1}    
  if (n < 1) {slideIndex = x.length}
  for (i = 0; i < x.length; i++) {
     x[i].style.display = "none";  
  }
  for (i = 0; i < dots.length; i++) {
     dots[i].className = dots[i].className.replace(" w3-white", "");
  }
  x[slideIndex-1].style.display = "block";  
  dots[slideIndex-1].className += " w3-white";
}
